# IQ Library Implementation Plan

## Overview
Create a comprehensive IQ file management system (IQ Library) similar to the existing Media Library, enabling upload, storage, selection, and playback of custom IQ files in SDR scenarios.

---

## Architecture

### Directory Structure
```
/scenarios/
  iq_library/          # Central IQ file storage
    demo.iq
    satcom-test.iq
    jamming-demo.iq
```

### Data Flow
```
User Upload → Orchestration API → iq_library/ → Scenario Config → SDR Service → GQRX
```

---

## Phase 1: Backend - IQ File Storage & API (30 min)

### 1.1 Directory Setup
**File:** `orchestration/app/main.py`

Add IQ library directory initialization:
```python
IQ_LIBRARY_DIR = "/scenarios/iq_library"

# After MEDIA_DIR setup (around line 46)
if not os.path.exists(IQ_LIBRARY_DIR):
    os.makedirs(IQ_LIBRARY_DIR, exist_ok=True)
```

### 1.2 List IQ Files Endpoint
**Endpoint:** `GET /api/v1/iq-library`

```python
@app.get("/api/v1/iq-library")
def list_iq_files():
    """List all IQ files in the library with metadata."""
    if not os.path.exists(IQ_LIBRARY_DIR):
        return {"iq_files": []}

    iq_files = []
    supported_formats = {'.iq', '.dat', '.raw', '.cfile'}

    try:
        for filename in os.listdir(IQ_LIBRARY_DIR):
            file_path = os.path.join(IQ_LIBRARY_DIR, filename)
            file_ext = os.path.splitext(filename)[1].lower()

            # Only process IQ files
            if file_ext not in supported_formats or not os.path.isfile(file_path):
                continue

            # Get file stats
            stat = os.stat(file_path)
            file_size = stat.st_size
            modified_time = stat.st_mtime

            # Calculate duration (assuming complex64 at 1.024 MHz)
            sample_rate = 1024000  # Default sample rate
            num_samples = file_size // 8  # 8 bytes per complex64 sample
            duration_seconds = num_samples / sample_rate

            iq_files.append({
                'filename': filename,
                'path': f"/iq_library/{filename}",
                'size': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2),
                'duration_seconds': round(duration_seconds, 1),
                'num_samples': num_samples,
                'modified': modified_time,
                'format': file_ext[1:]  # Remove leading dot
            })

        # Sort by filename
        iq_files.sort(key=lambda x: x['filename'])

        return {"iq_files": iq_files}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing IQ files: {str(e)}")
```

### 1.3 Upload IQ Files Endpoint
**Endpoint:** `POST /api/v1/iq-library/upload`

```python
@app.post("/api/v1/iq-library/upload")
async def upload_iq_file(files: List[UploadFile] = File(...)):
    """Upload IQ files to the library."""
    os.makedirs(IQ_LIBRARY_DIR, exist_ok=True)

    uploaded = []
    errors = []

    # Supported file types
    allowed_extensions = {'.iq', '.dat', '.raw', '.cfile'}

    # File size limit: 500MB (IQ files can be large)
    max_file_size = 500 * 1024 * 1024

    for file in files:
        try:
            file_ext = os.path.splitext(file.filename)[1].lower()

            # Validate file extension
            if file_ext not in allowed_extensions:
                errors.append({
                    "filename": file.filename,
                    "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                })
                continue

            # Read file content
            content = await file.read()
            file_size = len(content)

            # Validate file size
            if file_size > max_file_size:
                errors.append({
                    "filename": file.filename,
                    "error": f"File too large ({file_size / (1024*1024):.1f}MB > 500MB limit)"
                })
                continue

            # Validate file is complex64 format (size must be multiple of 8)
            if file_size % 8 != 0:
                errors.append({
                    "filename": file.filename,
                    "error": "File size invalid - must be multiple of 8 bytes (complex64 format)"
                })
                continue

            # Sanitize filename
            import re
            safe_filename = re.sub(r'[^\w\s.-]', '', file.filename)
            safe_filename = safe_filename.replace(' ', '-')

            # Handle filename conflicts
            base_name = os.path.splitext(safe_filename)[0]
            extension = os.path.splitext(safe_filename)[1]
            final_filename = safe_filename
            counter = 1

            while os.path.exists(os.path.join(IQ_LIBRARY_DIR, final_filename)):
                final_filename = f"{base_name}-{counter}{extension}"
                counter += 1

            # Save file
            file_path = os.path.join(IQ_LIBRARY_DIR, final_filename)
            with open(file_path, 'wb') as f:
                f.write(content)

            # Calculate metadata
            stat = os.stat(file_path)
            num_samples = file_size // 8
            sample_rate = 1024000
            duration_seconds = num_samples / sample_rate

            uploaded.append({
                'filename': final_filename,
                'original_filename': file.filename,
                'path': f"/iq_library/{final_filename}",
                'size': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2),
                'duration_seconds': round(duration_seconds, 1),
                'num_samples': num_samples,
                'modified': stat.st_mtime
            })

        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": f"Upload failed: {str(e)}"
            })

    return {
        "success": len(uploaded) > 0,
        "uploaded": uploaded,
        "errors": errors,
        "total": len(files),
        "successful": len(uploaded),
        "failed": len(errors)
    }
```

### 1.4 Delete IQ File Endpoint
**Endpoint:** `DELETE /api/v1/iq-library`

```python
@app.delete("/api/v1/iq-library")
def delete_iq_file(path: str):
    """Delete an IQ file from the library."""
    # Ensure path starts with /iq_library/
    if not path.startswith('/iq_library/'):
        raise HTTPException(status_code=400, detail="Invalid IQ library path")

    # Convert to filesystem path
    relative_path = path[13:]  # Remove '/iq_library/' prefix
    file_path = os.path.join(IQ_LIBRARY_DIR, relative_path)

    # Security: Ensure path is within IQ_LIBRARY_DIR
    real_library_dir = os.path.realpath(IQ_LIBRARY_DIR)
    real_file_path = os.path.realpath(file_path)

    if not real_file_path.startswith(real_library_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": "IQ file deleted successfully",
            "path": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
```

---

## Phase 2: Scenario Configuration Enhancement (10 min)

### 2.1 Update Scenario JSON Schema

**Example:** `scenarios/sdr-rf-monitoring-scenario.json`

Add `iq_file` field to scenario or team level:

```json
{
  "id": "sdr-rf-monitoring-scenario",
  "name": "SDR/RF Spectrum Monitoring",
  "iq_file": "/iq_library/demo.iq",
  "teams": [
    {
      "id": "sdr-rf",
      "dashboard_port": 3300,
      "dashboard_image": "team-dashboard-sdr:latest"
    }
  ]
}
```

Or per-team if different IQ files needed:
```json
{
  "teams": [
    {
      "id": "sdr-rf",
      "iq_file": "/iq_library/satcom-test.iq"
    }
  ]
}
```

---

## Phase 3: SDR Service Integration (15 min)

### 3.1 Update SDR Service to Accept IQ File Path

**File:** `sdr-service/app/main.py`

Change from hardcoded to environment variable:

```python
async def main():
    # Configuration from environment
    IQ_FILE = os.getenv('IQ_FILE_PATH', '/iq_files/demo.iq')
    SAMPLE_RATE = int(os.getenv('SAMPLE_RATE', '1024000'))

    print("=" * 60)
    print("SDR/GQRX Streaming Service")
    print("=" * 60)
    print(f"IQ File: {IQ_FILE}")
    print(f"Sample Rate: {SAMPLE_RATE} Hz")
```

### 3.2 Update Executor to Pass IQ File Path

**File:** `orchestration/app/executor.py`

In `_deploy_team_dashboards()` method, after deploying dashboards, deploy SDR service:

```python
def _deploy_sdr_service(self):
    """Deploy SDR service if scenario requires it."""
    # Check if scenario has iq_file configured
    iq_file = self.scenario_data.get('iq_file')
    if not iq_file:
        print("No IQ file configured, skipping SDR service deployment")
        return

    container_name = f"sdr-service-{self.scenario_name}"

    # Convert /iq_library/file.iq to absolute path
    if iq_file.startswith('/iq_library/'):
        iq_filename = iq_file[13:]  # Remove /iq_library/ prefix
        iq_file_host_path = f"/scenarios/iq_library/{iq_filename}"
    else:
        iq_file_host_path = iq_file

    print(f"Deploying SDR service with IQ file: {iq_file}")

    # Check if container exists and remove it
    try:
        existing_container = self.docker_client.containers.get(container_name)
        print(f"Found existing SDR service {container_name}. Stopping and removing...")
        existing_container.stop()
        existing_container.remove()
    except docker.errors.NotFound:
        pass

    try:
        container = self.docker_client.containers.run(
            'scip-v3-sdr-service:latest',
            name=container_name,
            detach=True,
            environment={
                'IQ_FILE_PATH': '/iq_files/current.iq',
                'SAMPLE_RATE': '1024000'
            },
            ports={'1234/tcp': 1234},
            volumes={
                iq_file_host_path: {
                    'bind': '/iq_files/current.iq',
                    'mode': 'ro'
                }
            },
            network='scip-v3_scip-network'
        )
        self.service_containers.append(container)
        print(f"SDR service deployed: {container.name}")

        container.reload()
        print(f"SDR service status: {container.status}")

    except docker.errors.APIError as e:
        print(f"Error deploying SDR service: {e}")
```

Add to `__init__`:
```python
self.service_containers = []  # Track service containers
```

Update `start()` method to call `_deploy_sdr_service()`:
```python
async def start(self):
    # ... existing code ...
    self._deploy_team_dashboards()
    self._deploy_sdr_service()  # NEW
    # ... rest of code ...
```

Update `stop()` method to clean up service containers:
```python
async def stop(self):
    # ... existing container cleanup ...

    # Stop and remove service containers
    for container in self.service_containers:
        try:
            print(f"Stopping and removing service container {container.name}")
            container.stop()
            container.remove()
        except Exception as e:
            print(f"Error stopping service container {container.name}: {e}")

    # ... rest of cleanup ...
```

---

## Phase 4: Frontend - IQ Library Page (45 min)

### 4.1 Create IQ Library Page Component

**File:** `client-dashboard/src/pages/IQLibraryPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Upload, Trash2, FileAudio, Clock, HardDrive } from 'lucide-react';

interface IQFile {
  filename: string;
  path: string;
  size: number;
  size_mb: number;
  duration_seconds: number;
  num_samples: number;
  modified: number;
  format: string;
}

export const IQLibraryPage = () => {
  const [iqFiles, setIqFiles] = useState<IQFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadIQFiles();
  }, []);

  const loadIQFiles = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/iq-library');
      const data = await response.json();
      setIqFiles(data.iq_files);
    } catch (error) {
      console.error('Failed to load IQ files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('http://localhost:8001/api/v1/iq-library/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully uploaded ${result.successful} file(s)`);
        loadIQFiles();
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (path: string, filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const response = await fetch(
        `http://localhost:8001/api/v1/iq-library?path=${encodeURIComponent(path)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        alert('File deleted');
        loadIQFiles();
      } else {
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IQ File Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage IQ files for SDR scenarios
          </p>
        </div>

        <label className="btn btn-primary cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload IQ Files'}
          <input
            type="file"
            multiple
            accept=".iq,.dat,.raw,.cfile"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">IQ Files ({iqFiles.length})</h2>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : iqFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No IQ files uploaded yet. Upload .iq, .dat, or .raw files to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {iqFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-4 bg-surface-dark rounded-lg hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileAudio className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{file.filename}</div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {file.size_mb} MB
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(file.duration_seconds)}
                        </span>
                        <span>{file.num_samples.toLocaleString()} samples</span>
                        <span className="uppercase">{file.format}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(file.path, file.filename)}
                    className="btn btn-error btn-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Supported Formats</h2>
        </div>
        <div className="card-content">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li><strong>.iq</strong> - Complex64 IQ samples (I/Q interleaved, 32-bit float)</li>
            <li><strong>.dat</strong> - Raw binary IQ data</li>
            <li><strong>.raw</strong> - Raw IQ samples</li>
            <li><strong>.cfile</strong> - GNU Radio complex float format</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            All files should contain complex64 samples (8 bytes per sample).
            Sample rate is assumed to be 1.024 MHz for duration calculation.
          </p>
        </div>
      </div>
    </div>
  );
};
```

### 4.2 Add IQ Library to Navigation

**File:** `client-dashboard/src/components/Sidebar.tsx`

Add to navigation array:
```typescript
{ name: 'IQ Library', path: '/iq-library', icon: FileAudio }
```

**File:** `client-dashboard/src/App.tsx`

Add route:
```typescript
import { IQLibraryPage } from './pages/IQLibraryPage';

// In routes:
<Route path="/iq-library" element={<IQLibraryPage />} />
```

---

## Phase 5: Scenario Editor IQ File Selection (30 min)

### 5.1 Add IQ File Selector to Scenario Form

**File:** `client-dashboard/src/pages/ScenarioEditorPage.tsx` (if exists, or create)

Add IQ file dropdown in scenario configuration form:

```typescript
const [availableIQFiles, setAvailableIQFiles] = useState<IQFile[]>([]);

useEffect(() => {
  // Load available IQ files
  fetch('http://localhost:8001/api/v1/iq-library')
    .then(res => res.json())
    .then(data => setAvailableIQFiles(data.iq_files));
}, []);

// In form:
<div className="form-group">
  <label>IQ File (Optional)</label>
  <select
    value={scenarioData.iq_file || ''}
    onChange={(e) => setScenarioData({
      ...scenarioData,
      iq_file: e.target.value
    })}
  >
    <option value="">None (No SDR service)</option>
    {availableIQFiles.map(file => (
      <option key={file.path} value={file.path}>
        {file.filename} ({file.size_mb}MB, {formatDuration(file.duration_seconds)})
      </option>
    ))}
  </select>
</div>
```

---

## Phase 6: Testing & Validation (20 min)

### Test Cases

1. **Upload Tests:**
   - ✓ Upload valid .iq file
   - ✓ Upload .dat, .raw, .cfile formats
   - ✓ Reject non-IQ files
   - ✓ Reject files > 500MB
   - ✓ Reject files not multiple of 8 bytes
   - ✓ Handle filename conflicts

2. **Library Tests:**
   - ✓ List all IQ files with correct metadata
   - ✓ Delete IQ file
   - ✓ Path traversal security (can't delete outside iq_library)

3. **Integration Tests:**
   - ✓ Deploy scenario without IQ file (no SDR service)
   - ✓ Deploy scenario with IQ file (SDR service starts)
   - ✓ SDR service reads correct IQ file
   - ✓ GQRX can connect and see spectrum
   - ✓ Stop scenario cleans up SDR service

4. **Edge Cases:**
   - ✓ Deploy scenario with missing IQ file (graceful error)
   - ✓ Upload IQ file while scenario running (file locked?)
   - ✓ Delete IQ file in use (should block or warn)

---

## Rollback Strategy

### Safety Measures
1. **Backward Compatibility:**
   - `iq_file` field is optional in scenario JSON
   - Existing scenarios without IQ files continue to work
   - SDR service only deploys if `iq_file` is present

2. **Rollback Steps:**
   - Remove IQ Library endpoints from orchestration
   - Remove IQ Library page from frontend
   - Remove `_deploy_sdr_service()` call from executor
   - SDR service falls back to hardcoded `/iq_files/demo.iq`

3. **Manual Fallback:**
   - Copy IQ file to `iq_files/demo.iq` manually
   - Start `docker-compose up -d sdr-service` manually
   - Works like original V1 implementation

---

## Files Modified Summary

### Backend
- `orchestration/app/main.py` - Add 3 new endpoints (list, upload, delete)
- `orchestration/app/executor.py` - Add `_deploy_sdr_service()`, update `start()` and `stop()`
- `sdr-service/app/main.py` - Read IQ path from environment variable

### Frontend
- `client-dashboard/src/pages/IQLibraryPage.tsx` - NEW
- `client-dashboard/src/components/Sidebar.tsx` - Add navigation item
- `client-dashboard/src/App.tsx` - Add route
- Scenario editor (if exists) - Add IQ file selector

### Configuration
- `docker-compose.yml` - Mount `/scenarios/iq_library` to orchestration (already mounted via /scenarios)
- No changes needed (already has /scenarios mounted)

---

## Estimated Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| 1 | Backend API (list, upload, delete) | 30 min |
| 2 | Scenario JSON schema | 10 min |
| 3 | SDR service integration | 15 min |
| 4 | Frontend IQ Library page | 45 min |
| 5 | Scenario editor integration | 30 min |
| 6 | Testing & validation | 20 min |
| **TOTAL** | | **2h 30min** |

---

## Confidence Level

**90% confidence**

### Risks
1. **Low Risk:** Backend API is identical pattern to media library (proven)
2. **Low Risk:** Docker volume mounting for dynamic IQ files (standard practice)
3. **Medium Risk:** File locking if IQ file deleted while in use (can add checks)
4. **Low Risk:** Frontend upload component (same as media library)

### Mitigations
- IQ file deletion check: Query running exercises before allowing delete
- Add file validation (header check for complex64 format)
- Add sample rate configuration per IQ file (future enhancement)

---

## Future Enhancements (Not in V1)

1. **IQ File Metadata:**
   - Store sample rate per file (not assumed)
   - Store center frequency
   - Store description/notes

2. **IQ File Preview:**
   - Generate spectrum thumbnail on upload
   - Show waterfall preview in library

3. **IQ File Conversion:**
   - Convert between formats (.dat → .iq)
   - Resample to different rates

4. **Multiple IQ Files per Scenario:**
   - Sequence multiple files
   - Playlist functionality

---

## Ready to Implement?

This plan provides:
- ✅ Complete file upload/management system
- ✅ Integration with existing scenario system
- ✅ Dynamic SDR service deployment
- ✅ Clean rollback path
- ✅ Backward compatibility

**Proceed with implementation?**
