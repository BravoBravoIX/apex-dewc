# SCIP v3 Timeline Editor Implementation Plan
**Date:** September 30, 2024
**Purpose:** Add timeline viewing and editing capabilities to the client dashboard

## Overview
Enable DEWC team to view, modify, add, and remove injects from team timelines through the client dashboard UI. Focus on reliability, simplicity, and preventing accidental disruption of running exercises.

## Requirements
- **Users:** DEWC team members (technical and non-technical)
- **Primary Actions:** View timelines, edit inject times, add/remove injects, upload media
- **Safety:** No editing while exercise is running
- **Storage:** Local file system (cloud-hosted VM)
- **Access:** All client dashboard users can edit
- **Time Management:** User manages inject timing (minute-level granularity)

## Implementation Phases

### Phase 1: Timeline Viewer with Time Editing (2 hours)
**Purpose:** Basic viewing and time adjustment capability

#### 1.1 API Endpoints
```python
# orchestration/app/main.py

@app.get("/api/v1/scenarios/{scenario_id}/timelines")
async def get_scenario_timelines(scenario_id: str):
    """List all timeline files for a scenario"""
    timelines_dir = f"/scenarios/timelines"
    timelines = {}

    # Check if exercise is running
    is_locked = scenario_id in active_exercises

    for file in os.listdir(timelines_dir):
        if file.startswith(f"timeline-") and file.endswith(".json"):
            team_id = file.replace("timeline-", "").replace(".json", "")
            with open(os.path.join(timelines_dir, file), 'r') as f:
                timelines[team_id] = json.load(f)

    return {
        "timelines": timelines,
        "locked": is_locked,
        "message": "Editing disabled while exercise is running" if is_locked else None
    }

@app.put("/api/v1/timelines/{team_id}/injects/{inject_id}/time")
async def update_inject_time(team_id: str, inject_id: str, request: dict):
    """Update just the time of an inject"""
    # Check if any exercise is running
    if active_exercises:
        raise HTTPException(status_code=423, detail="Cannot edit while exercise is running")

    timeline_path = f"/scenarios/timelines/timeline-{team_id}.json"

    # Backup before editing
    backup_path = timeline_path.replace(".json", ".backup.json")
    shutil.copy2(timeline_path, backup_path)

    with open(timeline_path, 'r') as f:
        timeline = json.load(f)

    # Find and update inject
    for inject in timeline.get('injects', []):
        if inject['id'] == inject_id:
            inject['time'] = request['time']  # Time in seconds
            break

    # Save updated timeline
    with open(timeline_path, 'w') as f:
        json.dump(timeline, f, indent=2)

    return {"status": "success", "new_time": request['time']}
```

#### 1.2 Timeline Viewer Page
```typescript
// client-dashboard/src/pages/TimelinesPage.tsx
import { useState, useEffect } from 'react';

interface Inject {
  id: string;
  time: number;
  type: string;
  priority?: string;
  content?: any;
  message?: string;
}

const TimelinesPage = () => {
  const [timelines, setTimelines] = useState<Record<string, any>>({});
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [editingInject, setEditingInject] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateInjectTime = async (teamId: string, injectId: string, newTime: number) => {
    try {
      const res = await fetch(`/api/v1/timelines/${teamId}/injects/${injectId}/time`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: newTime })
      });

      if (res.ok) {
        // Refresh timelines
        fetchTimelines();
        setEditingInject(null);
      }
    } catch (error) {
      console.error('Failed to update inject time:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Timeline Editor</h2>

      {isLocked && (
        <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded mb-4">
          <p className="text-yellow-400">Editing disabled while exercise is running</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* Team selector */}
        <div className="col-span-1">
          <h3 className="font-semibold mb-2">Teams</h3>
          {Object.keys(timelines).map(team => (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className={`block w-full text-left p-2 mb-1 rounded ${
                selectedTeam === team ? 'bg-primary text-white' : 'bg-surface'
              }`}
            >
              {team.toUpperCase()} Team
            </button>
          ))}
        </div>

        {/* Inject list */}
        <div className="col-span-3">
          {selectedTeam && (
            <div className="card p-4">
              <h3 className="font-semibold mb-4">{selectedTeam.toUpperCase()} Team Timeline</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Preview</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timelines[selectedTeam]?.injects?.map((inject: Inject) => (
                    <tr key={inject.id} className="border-b border-gray-800">
                      <td className="p-2">
                        {editingInject === inject.id ? (
                          <input
                            type="text"
                            defaultValue={inject.time}
                            onBlur={(e) => {
                              const newTime = parseInt(e.target.value);
                              if (!isNaN(newTime)) {
                                updateInjectTime(selectedTeam, inject.id, newTime);
                              }
                            }}
                            className="bg-gray-800 px-2 py-1 rounded w-20"
                          />
                        ) : (
                          <span className="font-mono">{formatTime(inject.time)}</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-gray-800 rounded text-sm">
                          {inject.type || 'unknown'}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-400">
                        {inject.content?.headline || inject.message || 'No preview'}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => setEditingInject(inject.id)}
                          disabled={isLocked}
                          className="text-primary hover:underline mr-2 disabled:opacity-50"
                        >
                          Edit Time
                        </button>
                        <button className="text-primary hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Phase 2: Full Inject Editor with Media Upload (3 hours)
**Purpose:** Complete inject editing with type-specific fields and media support

#### 2.1 Media Upload Endpoints
```python
# orchestration/app/main.py
import uuid
from fastapi import UploadFile, File

MEDIA_DIR = "/scenarios/media"

@app.post("/api/v1/media/upload")
async def upload_media(
    scenario_id: str,
    inject_id: str,
    file: UploadFile = File(...)
):
    """Upload media file for an inject"""
    # Create directory structure
    media_path = os.path.join(MEDIA_DIR, scenario_id, inject_id)
    os.makedirs(media_path, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(media_path, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Return reference path
    return {
        "filename": unique_filename,
        "path": f"/media/{scenario_id}/{inject_id}/{unique_filename}",
        "size": len(content)
    }

@app.get("/api/v1/media/{scenario_id}/{inject_id}/{filename}")
async def serve_media(scenario_id: str, inject_id: str, filename: str):
    """Serve uploaded media files"""
    file_path = os.path.join(MEDIA_DIR, scenario_id, inject_id, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")
```

#### 2.2 Inject Editor Modal
```typescript
// client-dashboard/src/components/InjectEditor.tsx
interface InjectEditorProps {
  inject: Inject;
  teamId: string;
  onSave: (inject: Inject) => void;
  onClose: () => void;
}

const InjectEditor: React.FC<InjectEditorProps> = ({ inject, teamId, onSave, onClose }) => {
  const [formData, setFormData] = useState(inject);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>(inject.media || []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/v1/media/upload?scenario_id=${scenarioId}&inject_id=${inject.id}`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      setUploadedMedia([...uploadedMedia, data.path]);
    }
  };

  const injectTypes = ['news', 'sms', 'email', 'intel', 'alert', 'social'];

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-surface p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Edit Inject: {inject.id}</h3>

        {/* Time Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Time (seconds)</label>
          <input
            type="number"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: parseInt(e.target.value)})}
            className="w-full bg-background border border-gray-600 rounded px-3 py-2"
          />
          <span className="text-xs text-gray-400">
            {formatTime(formData.time)}
          </span>
        </div>

        {/* Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full bg-background border border-gray-600 rounded px-3 py-2"
          >
            {injectTypes.map(type => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields based on Type */}
        {formData.type === 'news' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={formData.content?.headline || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, headline: e.target.value}
                })}
                className="w-full bg-background border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={formData.content?.body || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, body: e.target.value}
                })}
                className="w-full bg-background border border-gray-600 rounded px-3 py-2 h-32"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Source</label>
              <input
                type="text"
                value={formData.content?.source || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, source: e.target.value}
                })}
                className="w-full bg-background border border-gray-600 rounded px-3 py-2"
              />
            </div>
          </>
        )}

        {formData.type === 'sms' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="text"
                value={formData.content?.from || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, from: e.target.value}
                })}
                className="w-full bg-background border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={formData.content?.message || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content: {...formData.content, message: e.target.value}
                })}
                className="w-full bg-background border border-gray-600 rounded px-3 py-2 h-24"
                maxLength={160}
              />
              <span className="text-xs text-gray-400">
                {formData.content?.message?.length || 0}/160 characters
              </span>
            </div>
          </>
        )}

        {/* Media Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Media Attachments</label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="mb-2"
            accept="image/*,application/pdf,.doc,.docx"
          />
          {uploadedMedia.length > 0 && (
            <div className="text-sm text-gray-400">
              {uploadedMedia.map((path, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>📎 {path.split('/').pop()}</span>
                  <button
                    onClick={() => setUploadedMedia(uploadedMedia.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({...formData, media: uploadedMedia});
              onClose();
            }}
            className="px-4 py-2 bg-primary hover:bg-blue-700 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Phase 3: Add/Remove Injects (2 hours)
**Purpose:** Complete CRUD operations for timeline management

#### 3.1 Add/Remove Endpoints
```python
@app.post("/api/v1/timelines/{team_id}/injects")
async def add_inject(team_id: str, inject: dict):
    """Add new inject to timeline"""
    if active_exercises:
        raise HTTPException(status_code=423, detail="Cannot edit while exercise is running")

    timeline_path = f"/scenarios/timelines/timeline-{team_id}.json"

    # Backup
    backup_path = timeline_path.replace(".json", ".backup.json")
    shutil.copy2(timeline_path, backup_path)

    with open(timeline_path, 'r') as f:
        timeline = json.load(f)

    # Generate inject ID
    inject_count = len(timeline.get('injects', []))
    inject['id'] = f"inject-{team_id}-{inject_count + 1:03d}"

    # Add to timeline
    timeline['injects'].append(inject)

    # Sort by time
    timeline['injects'].sort(key=lambda x: x['time'])

    with open(timeline_path, 'w') as f:
        json.dump(timeline, f, indent=2)

    return {"status": "success", "inject_id": inject['id']}

@app.delete("/api/v1/timelines/{team_id}/injects/{inject_id}")
async def delete_inject(team_id: str, inject_id: str):
    """Remove inject from timeline"""
    if active_exercises:
        raise HTTPException(status_code=423, detail="Cannot edit while exercise is running")

    timeline_path = f"/scenarios/timelines/timeline-{team_id}.json"

    # Backup
    backup_path = timeline_path.replace(".json", ".backup.json")
    shutil.copy2(timeline_path, backup_path)

    with open(timeline_path, 'r') as f:
        timeline = json.load(f)

    # Remove inject
    timeline['injects'] = [i for i in timeline['injects'] if i['id'] != inject_id]

    with open(timeline_path, 'w') as f:
        json.dump(timeline, f, indent=2)

    return {"status": "success"}
```

## Inject Type Schemas

```typescript
// Define structured types for each inject category
interface NewsInject {
  type: 'news';
  content: {
    headline: string;
    body: string;
    source: string;
  };
  media?: string[];
}

interface SmsInject {
  type: 'sms';
  content: {
    from: string;
    message: string;
    profile_pic?: string;
  };
}

interface EmailInject {
  type: 'email';
  content: {
    from: string;
    subject: string;
    body: string;
    attachments?: string[];
  };
}

interface IntelInject {
  type: 'intel';
  content: {
    classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET';
    title: string;
    summary: string;
    full_report: string;
    media?: string[];
  };
}

interface SocialInject {
  type: 'social';
  content: {
    platform: 'twitter' | 'facebook' | 'instagram';
    username: string;
    handle: string;
    post: string;
    likes?: number;
    shares?: number;
    media?: string[];
  };
}
```

## Safety Features

1. **Exercise Lock Check**
   - Every edit endpoint checks `if active_exercises:`
   - UI shows lock banner when exercise running
   - All edit buttons disabled

2. **Automatic Backups**
   - Before any write: `shutil.copy2(timeline_path, backup_path)`
   - Keeps `.backup.json` for each timeline
   - Could extend to timestamped backups

3. **Validation**
   - Time must be >= 0
   - Inject IDs must be unique
   - Required fields per inject type

4. **User Feedback**
   - Success/error toasts
   - Confirm dialogs for delete
   - Show what changed

## UI Flow

1. **Navigate to Timelines** (new menu item in client dashboard)
2. **Select Team** from left sidebar
3. **View Timeline** in table format
4. **Quick Edit Time** inline without modal
5. **Full Edit** opens modal with all fields
6. **Add Inject** button opens blank modal
7. **Upload Media** within inject editor
8. **Save** validates and updates JSON file

## Future Enhancements

- **Templates Library**: Pre-built injects for common scenarios
- **Bulk Operations**: Select multiple injects to shift times
- **Timeline Visualization**: Gantt chart view
- **Diff View**: Show changes before saving
- **Version History**: Track who changed what when
- **Import/Export**: Share timelines between scenarios
- **AI Assist**: Generate realistic inject content

## Implementation Order

1. **Backend API** (Phase 1.1) - Basic read/write operations
2. **Timeline Viewer** (Phase 1.2) - Table view with time editing
3. **Media Upload** (Phase 2.1) - File handling infrastructure
4. **Inject Editor** (Phase 2.2) - Full editing modal
5. **Add/Remove** (Phase 3.1) - Complete CRUD operations
6. **Polish** - Validation, confirmations, user feedback

## Testing Checklist

- [ ] Cannot edit while exercise running
- [ ] Backups created before each edit
- [ ] Time changes persist correctly
- [ ] Media uploads work
- [ ] Media references saved in JSON
- [ ] Add inject generates unique ID
- [ ] Delete inject removes from JSON
- [ ] Timeline stays sorted by time
- [ ] UI updates after changes
- [ ] Error handling for invalid inputs
- [ ] **Team dashboards receive injects with media**
- [ ] **Team dashboards can display uploaded media**

## UI Enhancements (Updated)

### Icon Usage
- Use **Lucide React** icons instead of emojis for inject types:
  - News: `<Newspaper />`
  - SMS: `<MessageSquare />`
  - Email: `<Mail />`
  - Intel: `<FileSearch />`
  - Alert: `<AlertCircle />`
  - Social: `<Share2 />`
- Priority indicators with colored badges (no emojis)
- Media attachment icon: `<Paperclip />`

### Time Input
- Minute:Second picker format (5:30 instead of 330)
- Relative time adjustment buttons (+1 min, +5 min)
- Snap to nearest minute option

### Validation
- Minimum 30-second gap between injects
- SMS limited to 160 characters
- File size limit: 10MB per file
- Supported image formats: .jpg, .jpeg, .png, .gif

### Quick Actions
- Duplicate inject (copy and edit)
- Shift all inject times
- Batch time adjustment
- Quick type change in table view

## Critical: Media Delivery to Team Dashboards

### Team Dashboard Media Display
The team dashboards MUST be updated to handle media attachments:

```typescript
// team-dashboard/src/App.tsx - Update inject display
interface Inject {
  id: string;
  time: number;
  type?: string;
  content?: string | {
    headline?: string;
    body?: string;
    source?: string;
  };
  message?: string;
  media?: string[];  // Array of media file paths
  // ... other fields
}

// In the inject render section:
{inject.media && inject.media.length > 0 && (
  <div className="mt-2 flex gap-2">
    {inject.media.map((mediaPath, idx) => {
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaPath);

      if (isImage) {
        return (
          <img
            key={idx}
            src={`http://localhost:8001${mediaPath}`}
            alt="Inject media"
            className="max-w-md rounded cursor-pointer hover:opacity-80"
            style={{ maxWidth: '400px' }}
            onClick={() => window.open(`http://localhost:8001${mediaPath}`, '_blank')}
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+';
            }}
          />
        );
      }
    })}
  </div>
)}

// Handle action triggers
{inject.action && (
  <InjectAction action={inject.action} />
)}
```

### Action Trigger System
Actions are special inject types that trigger behaviors on the dashboard:

```typescript
interface InjectAction {
  type: 'alert' | 'system' | 'update' | 'custom';
  data?: any;
}

// Example action handler component
const InjectAction: React.FC<{ action: InjectAction }> = ({ action }) => {
  useEffect(() => {
    switch (action.type) {
      case 'alert':
        // Show prominent alert banner
        break;
      case 'system':
        // Display system notification
        break;
      case 'update':
        // Update dashboard state
        break;
      default:
        console.log('Unhandled action type:', action.type, action.data);
    }
  }, [action]);

  return null; // Actions may not render anything
};
```

### Media Delivery via MQTT
When the orchestrator publishes an inject, it must include media paths:

```python
# orchestration/app/executor.py
inject_with_metadata = {
    **inject,
    "delivered_at": elapsed_seconds,
    "team_id": team_id,
    "exercise_id": self.scenario_name,
    "media": inject.get("media", [])  # Include media array
}
```

### Static File Serving
The orchestration service must serve media files:

```python
# orchestration/app/main.py
from fastapi.staticfiles import StaticFiles

# Mount media directory as static route
app.mount("/media", StaticFiles(directory="/scenarios/media"), name="media")
```

This ensures:
1. Media files uploaded via timeline editor are stored in `/scenarios/media/`
2. Orchestrator includes media paths when publishing injects
3. Team dashboards receive media paths in inject messages
4. Team dashboards can fetch and display media via HTTP
5. Different media types (images, PDFs, documents) are handled appropriately

## Media Library System

### Shared Media Storage
```
/scenarios/media/
├── library/              # Shared media accessible to all teams
│   ├── maps/
│   ├── logos/
│   ├── documents/
│   └── images/
├── [scenario-name]/      # Scenario-specific media
│   ├── [team-id]/       # Team-specific media
│   └── shared/          # Shared within scenario
```

### Media Library API
```python
@app.get("/api/v1/media/library")
async def list_media_library():
    """List all available media in the library"""
    library_path = "/scenarios/media/library"
    media_files = []

    for root, dirs, files in os.walk(library_path):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, library_path)

            # Generate thumbnail for images
            is_image = file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))

            media_files.append({
                "filename": file,
                "path": f"/media/library/{rel_path}",
                "type": "image" if is_image else "document",
                "size": os.path.getsize(file_path),
                "thumbnail": f"/api/v1/media/thumbnail/{rel_path}" if is_image else None
            })

    return {"media": media_files}

@app.get("/api/v1/media/thumbnail/{path:path}")
async def get_thumbnail(path: str):
    """Generate and serve thumbnail for images"""
    # Use Pillow to generate 150x150 thumbnail
    # Cache thumbnails for performance
    pass
```

### Media Library UI Component
```typescript
// client-dashboard/src/components/MediaLibrary.tsx
interface MediaLibraryProps {
  onSelect: (mediaPath: string) => void;
  selectedMedia: string[];
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, selectedMedia }) => {
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState('all');

  return (
    <div className="media-library">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('images')}>Images</button>
        <button onClick={() => setFilter('documents')}>Documents</button>
      </div>

      <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {media.map((item) => (
          <div
            key={item.path}
            className={`border rounded p-2 cursor-pointer ${
              selectedMedia.includes(item.path) ? 'border-primary' : 'border-gray-600'
            }`}
            onClick={() => onSelect(item.path)}
          >
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.filename} className="w-full h-24 object-cover mb-2" />
            ) : (
              <div className="w-full h-24 bg-gray-700 flex items-center justify-center mb-2">
                <FileText className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <p className="text-xs truncate">{item.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Cross-Team Inject Distribution

### Add to All Teams Feature
```python
@app.post("/api/v1/timelines/broadcast-inject")
async def add_inject_to_all_teams(inject: dict):
    """Add the same inject to all team timelines"""
    if active_exercises:
        raise HTTPException(status_code=423, detail="Cannot edit while exercise is running")

    teams = []
    timelines_dir = "/scenarios/timelines"

    # Find all team timelines
    for file in os.listdir(timelines_dir):
        if file.startswith("timeline-") and file.endswith(".json"):
            team_id = file.replace("timeline-", "").replace(".json", "")
            teams.append(team_id)

    results = []
    for team_id in teams:
        timeline_path = f"{timelines_dir}/timeline-{team_id}.json"

        # Backup
        backup_path = timeline_path.replace(".json", ".backup.json")
        shutil.copy2(timeline_path, backup_path)

        with open(timeline_path, 'r') as f:
            timeline = json.load(f)

        # Create team-specific inject ID
        inject_copy = inject.copy()
        inject_count = len(timeline.get('injects', []))
        inject_copy['id'] = f"inject-{team_id}-{inject_count + 1:03d}"

        timeline['injects'].append(inject_copy)
        timeline['injects'].sort(key=lambda x: x['time'])

        with open(timeline_path, 'w') as f:
            json.dump(timeline, f, indent=2)

        results.append({"team": team_id, "inject_id": inject_copy['id']})

    return {"status": "success", "teams_updated": results}
```

### UI for Cross-Team Distribution
```typescript
// In the inject editor modal
<div className="mb-4 bg-blue-900/20 border border-blue-600 p-4 rounded">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={addToAllTeams}
      onChange={(e) => setAddToAllTeams(e.target.checked)}
    />
    <span className="font-medium">Add to All Team Timelines</span>
  </label>
  <p className="text-xs text-gray-400 mt-1">
    This inject will be added to all team timelines at the same time mark
  </p>
</div>

// When saving
const handleSave = async () => {
  if (addToAllTeams) {
    await fetch('/api/v1/timelines/broadcast-inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
  } else {
    // Save to single team
  }
};
```

## Detailed Implementation Plan by Priority

### Priority 1: Team Dashboards Display Media & Handle Actions (Critical Foundation)
**Goal:** Ensure team dashboards can receive and display image media, and handle action triggers

**Step-by-Step Plan:**

1. **Update Inject Interface in Team Dashboard**
   - Add `media?: string[]` to the Inject type definition (for images)
   - Add `action?: { type: string, data?: any }` for action triggers
   - Ensure backward compatibility (both fields optional)

2. **Create Media Display Component (Images Only)**
   - Support image formats: .jpg, .jpeg, .png, .gif
   - Display images inline with constraints (max-width: 400px)
   - Click to open full size in new tab
   - Handle missing/broken images gracefully (show placeholder)
   - No need for PDF/document handling

3. **Add Action Handler System**
   - Check for `action` field in inject
   - Action types might include:
     - `"alert"`: Show prominent notification
     - `"system"`: Display system message
     - `"update"`: Update dashboard state
   - Actions may have no media (just trigger behavior)
   - Log unhandled action types for future implementation

4. **Update Orchestrator to Include Media and Actions**
   - Modify executor.py inject publishing:
     ```
     "media": inject.get("media", []),
     "action": inject.get("action", None)
     ```
   - Test with both media injects and action injects
   - Ensure injects can have media, action, or both

5. **Add Static File Serving for Images**
   - Mount `/scenarios/media` directory as static route
   - Serve image files from `/media/*` endpoint
   - Support JPG and PNG formats
   - Ensure proper CORS headers

6. **Testing Protocol**
   - Create test images: `test-image.jpg`, `test-image.png`
   - Test inject with media: `"media": ["/media/library/test-image.jpg"]`
   - Test inject with action: `"action": {"type": "alert", "data": {"severity": "high"}}`
   - Test inject with both media and action
   - Test inject with neither (traditional text-only)

**Success Criteria:**
- Team dashboards display JPG/PNG images inline
- Images constrained to reasonable size
- Click image to view full size
- Action triggers execute (even without media)
- No errors when media field is missing
- No errors when action field is missing
- Can have media without action
- Can have action without media

### Priority 2: Basic Timeline Viewer with Time Editing
**Goal:** Create read-only timeline viewer with ability to edit inject times

**Step-by-Step Plan:**

1. **Create New Route and Page**
   - Add `/timelines` route to client dashboard
   - Create TimelinesPage.tsx component
   - Add menu item to navigation

2. **Build Timeline API Endpoints**
   - GET endpoint to list all timelines for a scenario
   - GET endpoint to fetch specific team timeline
   - PUT endpoint to update inject time
   - Add exercise lock check (return 423 if exercise running)

3. **Create Timeline Viewer UI**
   - Left sidebar: Team selector buttons
   - Right content: Table with columns (Time, Type, Preview, Actions)
   - Format time as T+MM:SS for display
   - Show first line of content as preview

4. **Implement Time Editing**
   - "Edit Time" button changes time to input field
   - Accept time in seconds or MM:SS format
   - Validate time is positive integer
   - Save on blur or Enter key
   - Show loading spinner during save
   - Refresh timeline after successful save

5. **Add Safety Features**
   - Check if exercise is running on page load
   - Show warning banner if locked
   - Disable all edit buttons when locked
   - Create backup before any edit
   - Show success/error toast messages

**Success Criteria:**
- Can view all team timelines
- Can edit inject times
- Cannot edit while exercise running
- Backups created automatically
- Times stay in chronological order

### Priority 3: Media Library System
**Goal:** Browse and select from shared media library

**Step-by-Step Plan:**

1. **Create Media Directory Structure**
   - `/scenarios/media/library/` for shared media
   - Subdirectories: maps/, logos/, documents/, images/
   - Add sample media files for testing

2. **Build Media Library API**
   - Endpoint to list all library media
   - Return metadata: filename, path, type, size
   - Generate thumbnails for images (150x150px)
   - Cache thumbnails for performance

3. **Create Media Library Browser Component**
   - Modal or slide-out panel design
   - Filter buttons: All, Images, Documents
   - Grid view with thumbnails/icons
   - Show filename below each item
   - Multi-select with checkboxes

4. **Integrate with Inject Editor**
   - "Select from Library" button opens browser
   - Selected media paths added to inject
   - Show selected count
   - Preview selected media

5. **Optimize Performance**
   - Lazy load thumbnails
   - Paginate if >50 items
   - Client-side filtering
   - Debounce search input

**Success Criteria:**
- Can browse all library media
- Thumbnails display for images
- Can filter by type
- Can select multiple items
- Selected paths correctly added to inject

### Priority 4: Media Upload with Preview
**Goal:** Upload new media files with preview capability

**Step-by-Step Plan:**

1. **Create Upload API Endpoint**
   - Accept multipart form data
   - Validate file types (whitelist extensions)
   - Check file size (<10MB)
   - Generate unique filename if collision
   - Save to appropriate directory

2. **Build Upload UI Component**
   - Drag-and-drop zone
   - Click to browse files
   - Show upload progress bar
   - Display file preview after upload
   - Allow multiple file selection

3. **Add Preview Capabilities**
   - Show image thumbnails immediately
   - Display file icon for non-images
   - Show file size and type
   - Remove button for each file

4. **Handle Upload Errors**
   - File too large error
   - Unsupported type error
   - Network error with retry
   - Server error handling

5. **Integrate with Timeline Editor**
   - Upload directly in inject editor
   - Uploaded files automatically added to inject
   - Show in media preview section
   - Can remove before saving

**Success Criteria:**
- Can upload images and documents
- Preview shows immediately
- Progress bar during upload
- Error messages are clear
- Files saved to correct directory

### Priority 5: Full Inject Editor with Cross-Team Feature
**Goal:** Complete inject editing with "Add to All Teams" option

**Step-by-Step Plan:**

1. **Create Inject Editor Modal**
   - Full-screen or large modal
   - Tab sections for different inject types
   - Dynamic fields based on type selection
   - Media section at bottom

2. **Build Type-Specific Forms**
   - News: headline, body, source fields
   - SMS: from, message (with character count)
   - Email: from, subject, body
   - Intel: classification, title, summary, report
   - Social: platform, username, post, metrics

3. **Add Cross-Team Distribution**
   - Checkbox: "Add to All Team Timelines"
   - Warning about adding to all teams
   - API endpoint for broadcast inject
   - Generate unique ID per team
   - Show success for each team

4. **Implement Save Logic**
   - Validate required fields
   - Check time conflicts
   - Create backups
   - Save to single team or all teams
   - Update UI after save

5. **Add Rich Text Editing**
   - Basic formatting for body fields
   - Link support
   - Preserve formatting in JSON
   - Preview formatted text

**Success Criteria:**
- Can edit all inject fields
- Type-specific forms work correctly
- Can add to all teams at once
- Media attachments preserved
- Validation prevents errors

### Priority 6: Add/Remove Inject Capabilities
**Goal:** Complete CRUD operations for timeline management

**Step-by-Step Plan:**

1. **Create Add Inject UI**
   - "Add Inject" button in timeline viewer
   - Opens editor with blank form
   - Default time is last inject + 1 minute
   - Auto-generate inject ID

2. **Build Delete Functionality**
   - Delete button in timeline table
   - Confirmation dialog
   - Show inject preview in confirmation
   - Create backup before delete
   - Remove from timeline array

3. **Add Duplicate Feature**
   - Duplicate button in timeline table
   - Copy all inject fields
   - Increment time by 1 minute
   - Generate new ID
   - Open in editor for modifications

4. **Implement Batch Operations**
   - Select multiple injects
   - Batch delete with confirmation
   - Batch time shift
   - Batch type change

5. **Add Inject Templates**
   - Common inject templates
   - Template selector in add dialog
   - Pre-fill fields from template
   - Save custom templates

**Success Criteria:**
- Can add new injects
- Can delete with confirmation
- Can duplicate and modify
- IDs are unique
- Timeline stays sorted

## Testing Strategy for Each Priority

### Priority 1 Testing
- Create test media files
- Add to timeline manually
- Deploy and verify display
- Test each media type

### Priority 2 Testing
- View existing timelines
- Edit times and verify save
- Check backup creation
- Test exercise lock

### Priority 3 Testing
- Add sample media to library
- Browse and filter
- Select multiple items
- Verify paths correct

### Priority 4 Testing
- Upload various file types
- Test size limits
- Check error handling
- Verify file storage

### Priority 5 Testing
- Edit each inject type
- Test all teams feature
- Verify validation
- Check media preservation

### Priority 6 Testing
- Add new inject
- Delete with confirmation
- Duplicate and modify
- Test batch operations