# Priority 4: Media Upload System - Detailed Implementation Plan

## Overview
Implement a web-based media upload system that allows users to upload images directly through the Media Library interface, making them immediately available for use in timeline injects.

## Goals
- Upload images via drag-and-drop or file browser
- Validate file types and sizes before upload
- Show upload progress and status
- Automatically refresh media library after successful upload
- Handle errors gracefully

## Integration Points with Existing Code
**CRITICAL**: Must not break existing functionality:
- Priority 3: Media Library browsing and search
- Option 3: Timeline Viewer media selection
- Backend API: `/api/v1/media` endpoint must continue working

## 1. Backend Upload Endpoint

### 1.1 Create Upload API Endpoint
**File**: `/orchestration/app/main.py`

**New Endpoint**: `POST /api/v1/media/upload`

**Functionality**:
- Accept multipart/form-data file uploads
- Support multiple files in single request
- Validate file types (JPG, PNG, GIF, SVG only)
- Validate file sizes (max 10MB per file)
- Check for filename conflicts
- Save files to `/scenarios/media/library/`
- Return list of successfully uploaded files with metadata

**Request Format**:
```python
# FormData with files
files: List[UploadFile]
```

**Response Format**:
```json
{
  "success": true,
  "uploaded": [
    {
      "filename": "image.png",
      "path": "/media/library/image.png",
      "size": 123456,
      "width": 800,
      "height": 600
    }
  ],
  "errors": []
}
```

**Error Handling**:
- Invalid file type: Return 400 with clear message
- File too large: Return 413 with size limit
- Duplicate filename: Return 409 with conflict info
- Storage error: Return 500 with error details

### 1.2 File Validation
**Validations**:
- File extension must be: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`
- MIME type verification (not just extension)
- File size limit: 10MB (configurable)
- Filename sanitization (remove special characters, spaces)

**Security Considerations**:
- Reject files with executable extensions
- Validate actual file content (not just extension)
- Prevent directory traversal attacks
- Limit total upload size per request

### 1.3 Filename Conflict Resolution
**Strategy**: Automatic renaming
- If `image.png` exists, save as `image-1.png`
- If `image-1.png` exists, save as `image-2.png`
- Continue incrementing until unique name found
- Return both original and saved filename to user

### 1.4 Dependencies
**Required Python packages** (add to `requirements.txt`):
- `python-multipart` - For multipart form parsing
- `Pillow` - Already installed for metadata extraction

## 2. Frontend Upload Component

### 2.1 Upload Modal/Interface
**File**: `/client-dashboard/src/components/MediaUpload.tsx` (new component)

**Features**:
- Drag-and-drop zone
- Click to browse file selector
- Multi-file selection support
- Preview selected files before upload
- Upload progress per file
- Success/error indicators

**UI Structure**:
```
┌─────────────────────────────────────┐
│  Upload Media                    [X]│
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐  │
│   │  Drag files here or click   │  │
│   │  to browse                  │  │
│   │                             │  │
│   │  [Browse Files]             │  │
│   └─────────────────────────────┘  │
│                                     │
│  Selected Files:                    │
│  ┌───────────────────────────────┐ │
│  │ image1.png (500KB) [Remove]   │ │
│  │ image2.jpg (1.2MB) [Remove]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Cancel]           [Upload Files] │
└─────────────────────────────────────┘
```

### 2.2 Drag-and-Drop Implementation
**Using HTML5 Drag & Drop API**:
- `onDragEnter`: Highlight drop zone
- `onDragOver`: Prevent default to allow drop
- `onDragLeave`: Remove highlight
- `onDrop`: Extract files, validate, add to upload list

**Validation on Drop**:
- Check file types immediately
- Check file sizes immediately
- Show errors for invalid files
- Only add valid files to upload queue

### 2.3 File Preview
**Show for each selected file**:
- Thumbnail preview (if image can be read)
- Filename
- File size (formatted: KB/MB)
- File type icon
- Remove button (X)

**Image Preview**:
- Use `FileReader` API to read as Data URL
- Display as small thumbnail (50x50px)
- Fallback to file icon if preview fails

### 2.4 Upload Progress
**Progress Tracking**:
- Use `XMLHttpRequest` or `fetch` with progress events
- Show progress bar per file (0-100%)
- Display upload speed (optional)
- Show overall progress (X of Y files uploaded)

**States per File**:
- Pending: Waiting to upload
- Uploading: In progress with %
- Success: Green checkmark
- Error: Red X with error message

### 2.5 Integration with Media Library Page
**File**: `/client-dashboard/src/pages/MediaLibraryPage.tsx`

**Changes**:
1. Replace placeholder button with real upload trigger
2. Add state for upload modal visibility
3. Trigger media library refresh after successful upload

**Updated Button**:
```tsx
<button
  onClick={() => setShowUploadModal(true)}
  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
>
  <Upload size={18} />
  Upload Media
</button>
```

**Upload Modal Integration**:
```tsx
{showUploadModal && (
  <MediaUpload
    onClose={() => setShowUploadModal(false)}
    onUploadComplete={() => {
      setShowUploadModal(false);
      fetchMedia(); // Refresh library
    }}
  />
)}
```

## 3. Upload Flow

### 3.1 User Workflow
1. User clicks "Upload Media" button in Media Library
2. Upload modal opens
3. User drags files OR clicks "Browse Files"
4. Files are validated client-side
5. Invalid files show error messages
6. Valid files appear in preview list
7. User clicks "Upload Files"
8. Each file uploads with progress indicator
9. Success/error feedback shown per file
10. On completion, modal closes
11. Media library auto-refreshes showing new files

### 3.2 Technical Flow
```
Client Side:
1. User selects files
2. Validate file types/sizes
3. Create FormData with files
4. POST to /api/v1/media/upload
5. Track upload progress
6. Handle response

Server Side:
1. Receive multipart form data
2. Validate each file
3. Check for filename conflicts
4. Save to /scenarios/media/library/
5. Extract metadata (size, dimensions)
6. Return success/error per file

Client Side:
1. Parse response
2. Show success/error per file
3. Close modal on success
4. Refresh media library
```

## 4. Error Handling

### 4.1 Client-Side Errors
- **No files selected**: Disable upload button
- **Invalid file type**: Show error, don't add to queue
- **File too large**: Show error with size limit
- **Network error**: Retry option
- **Upload timeout**: Clear error message

### 4.2 Server-Side Errors
- **Validation failed**: Return 400 with specific errors per file
- **Storage error**: Return 500, suggest retry
- **Disk space full**: Return 507, inform user
- **Permission denied**: Return 403, log for admin

### 4.3 Partial Success Handling
**Scenario**: Upload 5 files, 3 succeed, 2 fail

**Response**:
```json
{
  "success": true,
  "uploaded": [
    {"filename": "img1.png", ...},
    {"filename": "img2.jpg", ...},
    {"filename": "img3.png", ...}
  ],
  "errors": [
    {"filename": "img4.bmp", "error": "Invalid file type"},
    {"filename": "huge.jpg", "error": "File too large (15MB > 10MB limit)"}
  ]
}
```

**UI Behavior**:
- Show success count: "3 of 5 files uploaded successfully"
- List failed files with error messages
- Ask: "Close" or "Retry Failed"
- Still refresh media library (to show successful uploads)

## 5. Performance Considerations

### 5.1 Upload Optimization
- **Chunked uploads**: Not needed for 10MB limit (future enhancement)
- **Concurrent uploads**: Upload files sequentially for simplicity
- **Compression**: Not needed, preserve original quality
- **Thumbnail generation**: Reuse existing Pillow logic from media list endpoint

### 5.2 UI Performance
- **Lazy image previews**: Only generate preview when file added
- **Debounce drag events**: Prevent excessive re-renders
- **Cleanup**: Revoke object URLs after upload to prevent memory leaks

### 5.3 File Size Limits
**Recommended Limits**:
- Per file: 10MB (configurable)
- Per request: 50MB total (5 files max)
- Nginx upload limit: Update to match (default 1MB too small)

**Nginx Configuration Update** (if needed):
```nginx
client_max_body_size 50M;
```

## 6. Testing Requirements

### 6.1 Upload Functionality Tests
- Upload single image (JPG, PNG, GIF, SVG)
- Upload multiple images at once
- Upload with duplicate filename (verify auto-rename)
- Upload invalid file type (verify rejection)
- Upload oversized file (verify rejection)
- Upload while offline (verify error handling)

### 6.2 Integration Tests
- Media library auto-refreshes after upload
- Uploaded images immediately available in Timeline Viewer
- Search finds newly uploaded images
- Grid/List views show new images correctly

### 6.3 Edge Cases
- Upload 0 files (button should be disabled)
- Upload 100 files (should work or show limit)
- Upload file with special characters in name
- Upload file with very long filename (>255 chars)
- Upload during existing upload (queue or prevent?)
- Upload same file twice in one batch

## 7. Security Considerations

### 7.1 File Validation
- **Extension check**: Whitelist only allowed extensions
- **MIME type check**: Verify actual file content
- **Magic number check**: Read file header to confirm type
- **Image validation**: Use Pillow to verify it's a valid image

### 7.2 Path Security
- **No directory traversal**: Sanitize filenames
- **Flat structure**: Save all files to `/scenarios/media/library/` only
- **No user-controlled paths**: Don't allow path in upload request

### 7.3 Storage Limits
- **Disk space check**: Verify space before save
- **Quota enforcement**: Optional per-user limits (future)
- **Old file cleanup**: Manual process (future enhancement)

## 8. Implementation Steps

### Step 1: Backend Upload Endpoint (1 hour)
1. Add `python-multipart` to requirements.txt
2. Create upload endpoint in main.py
3. Implement file validation
4. Implement filename conflict resolution
5. Test with curl/Postman

### Step 2: MediaUpload Component (1-1.5 hours)
1. Create new MediaUpload.tsx component
2. Implement drag-and-drop zone
3. Implement file browser
4. Add file preview list
5. Add remove file functionality
6. Style with existing theme

### Step 3: Upload Progress & Feedback (0.5 hour)
1. Implement progress tracking
2. Add success/error indicators
3. Add upload state management
4. Test upload flow

### Step 4: Integration with Media Library (0.5 hour)
1. Replace placeholder button in MediaLibraryPage
2. Add upload modal state
3. Implement auto-refresh after upload
4. Test end-to-end workflow

### Step 5: Error Handling & Polish (0.5 hour)
1. Add all error scenarios
2. Improve user feedback messages
3. Add loading states
4. Polish UI/UX

### Step 6: Testing (0.5 hour)
1. Test all file types
2. Test error scenarios
3. Test with multiple files
4. Test integration with Timeline Viewer
5. Verify no Priority 3 functionality broken

## 9. Acceptance Criteria

### Must Have
✓ Upload images via drag-and-drop
✓ Upload images via file browser
✓ Support JPG, PNG, GIF, SVG
✓ Reject invalid file types with clear error
✓ Reject oversized files (>10MB)
✓ Show upload progress
✓ Show success/error per file
✓ Auto-refresh media library after upload
✓ Handle duplicate filenames (auto-rename)
✓ Uploaded images immediately usable in Timeline Viewer
✓ No breaking changes to Priority 3 features

### Nice to Have (If Time Permits)
- Image compression option
- Bulk upload progress (X of Y files)
- Upload history/recent uploads
- Undo upload (delete just-uploaded file)

## 10. Risk Assessment

### Risks

1. **Breaking existing media library functionality**
   - *Mitigation*: Thorough testing of all Priority 3 features after implementation
   - *Probability*: Low
   - *Impact*: High

2. **File upload size limits (Nginx/Docker)**
   - *Mitigation*: Test with 10MB files, update nginx config if needed
   - *Probability*: Medium
   - *Impact*: Medium

3. **Filename conflicts causing overwrites**
   - *Mitigation*: Implement auto-rename, never overwrite
   - *Probability*: Low
   - *Impact*: High

4. **Storage filling up**
   - *Mitigation*: Document manual cleanup process, add disk space check
   - *Probability*: Low
   - *Impact*: Medium

5. **Invalid files crashing server**
   - *Mitigation*: Robust validation, try/catch blocks, test with malformed files
   - *Probability*: Low
   - *Impact*: High

## 11. Time Estimate

- Backend endpoint: 1 hour
- Frontend component: 1-1.5 hours
- Progress & feedback: 0.5 hour
- Integration: 0.5 hour
- Error handling: 0.5 hour
- Testing: 0.5 hour

**Total: 4-5 hours**

## 12. Success Metrics

- Upload completes in <5 seconds for 5MB file
- Zero errors when uploading valid images
- 100% of uploaded images appear in library within 1 second
- All uploaded images usable in Timeline Viewer immediately
- No regressions in Priority 3 functionality

## 13. Future Enhancements (Not in Priority 4)

- Drag-and-drop directly in Timeline Viewer
- Image cropping/editing before upload
- Bulk delete uploaded images
- Image categorization/tagging
- Upload from URL
- Image optimization (auto-resize, compress)
- Upload queue for very large batches
- User upload history

---

## Summary

Priority 4 adds a complete web-based upload system that seamlessly integrates with the existing media library. Users can drag-and-drop images, see immediate feedback, and have uploaded images instantly available for use in timeline injects. The implementation focuses on simplicity, security, and not breaking any existing functionality.

**Key Integration Points**:
- Backend: Extends existing `/api/v1/media` infrastructure
- Frontend: Enhances Media Library page with upload capability
- Workflow: Uploaded files immediately appear in media browser modal in Timeline Viewer

**Confidence: 90%**

The implementation is straightforward with well-defined requirements. Slightly lower than 95% due to potential nginx upload size configuration needs and ensuring zero breakage of Priority 3 features. All technical approaches are proven and libraries needed are already in place or trivial to add.
