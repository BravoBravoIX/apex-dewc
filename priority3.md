# Priority 3: Media Library System - Detailed Implementation Plan

## Overview
Create a comprehensive media library system that allows users to browse, view, and manage images that can be attached to injects. The system will provide an easy way to see available media and copy paths for use in timeline editing.

## 1. Backend API Endpoints

### 1.1 List Media Files
- **Endpoint**: `GET /api/v1/media`
- **Functionality**:
  - Scan `/scenarios/media/library/` directory recursively
  - Return list of all image files (jpg, jpeg, png, gif, svg)
  - Include metadata for each file:
    - Filename
    - Path (relative to media root)
    - File size
    - Dimensions (width x height)
    - Last modified date
    - MIME type
- **Response format**: JSON array of media objects

### 1.2 Get Media Metadata
- **Endpoint**: `GET /api/v1/media/{path}`
- **Functionality**:
  - Return detailed metadata for specific image
  - Include usage information (which timelines reference this image)
- **Response format**: JSON object with full metadata

### 1.3 Media Thumbnail Generation
- **Consideration**: Whether to generate thumbnails on-the-fly or use full images
- **Decision**: Use full images with CSS sizing for simplicity initially
- **Future enhancement**: Add thumbnail generation if performance issues arise

## 2. Frontend Media Library Page

### 2.1 Page Structure
- **Location**: New route `/media` in client dashboard
- **Navigation**: Add "Media Library" to sidebar navigation
- **Layout**:
  - Header with title and view controls
  - Search/filter bar
  - Main content area with switchable views
  - Detail panel (when image selected)

### 2.2 View Modes

#### Grid View (Default)
- Display images as thumbnails in responsive grid
- 4-5 columns on desktop, 2-3 on tablet, 1-2 on mobile
- Each thumbnail shows:
  - Image preview (200x200px max)
  - Filename below image
  - File size badge
  - Hover effect with quick actions
- Click to select and show details
- Double-click to open full size

#### List View
- Table format with columns:
  - Thumbnail (50x50px)
  - Filename
  - Dimensions
  - File size
  - Modified date
  - Copy path button
- Sortable columns
- More compact for many files

### 2.3 Search and Filter Features
- **Search bar**: Filter by filename
- **Filter options**:
  - File type (PNG, JPG, SVG, etc.)
  - Size range (small <100KB, medium 100KB-1MB, large >1MB)
  - Date range (recently added)
  - Dimensions (portrait, landscape, square)
- **Sort options**:
  - Name (A-Z, Z-A)
  - Date modified (newest, oldest)
  - File size (largest, smallest)

### 2.4 Image Detail Panel
When an image is selected, show sidebar or modal with:
- **Full preview**: Larger preview with actual dimensions
- **Metadata display**:
  - Full filename
  - Path (with copy button)
  - Dimensions in pixels
  - File size
  - MIME type
  - Last modified date
- **Usage information**:
  - List of timelines using this image
  - Links to those timelines
- **Actions**:
  - Copy path to clipboard
  - Open full size in new tab
  - Download original

### 2.5 Path Copying Feature
- **One-click copy**: Button to copy full path (e.g., `/media/library/image.png`)
- **Visual feedback**: Show "Copied!" confirmation
- **Format**: Path format ready for timeline JSON
- **Multiple formats**:
  - Relative path for timelines: `/media/library/image.png`
  - Full URL for testing: `http://localhost:8001/media/library/image.png`

## 3. UI/UX Considerations

### 3.1 Loading States
- Skeleton loaders while fetching media list
- Progressive image loading (blur-up technique)
- Lazy loading for images below fold
- Show loading spinner for large images

### 3.2 Error Handling
- Handle missing images gracefully
- Show placeholder for broken images
- Display friendly error messages
- Retry mechanism for failed loads

### 3.3 Empty States
- Clear message when no media files exist
- Instructions on how to add media
- Link to upload feature (Priority 4)

### 3.4 Responsive Design
- Mobile-friendly grid layout
- Touch-friendly controls
- Swipe gestures for image gallery
- Proper scaling on different devices

## 4. Performance Optimizations

### 4.1 Image Loading
- Lazy load images as user scrolls
- Use intersection observer for viewport detection
- Preload next/previous images in detail view
- Cache loaded images in browser

### 4.2 Data Management
- Paginate results if >50 images
- Virtual scrolling for large lists
- Client-side caching of media list
- Debounce search input

### 4.3 Network Optimization
- Serve images with proper cache headers
- Use CDN-friendly paths
- Compress images if needed
- Support for WebP format (future)

## 5. Integration Points

### 5.1 With Timeline Editor
- Quick action to insert path into timeline
- Show which injects use each image
- Preview images referenced in timelines
- Validate image paths exist

### 5.2 With Exercise System
- Ensure images are accessible during exercises
- Handle missing images gracefully
- Track image usage statistics
- Support for team-specific media folders (future)

## 6. Technical Implementation Details

### 6.1 Backend Technologies
- FastAPI for media endpoints
- Python Pillow for image metadata
- OS file system scanning
- Static file serving via FastAPI

### 6.2 Frontend Technologies
- React component for media grid
- CSS Grid for layout
- Lazy loading with Intersection Observer
- Clipboard API for copying paths
- React state for view preferences

### 6.3 Data Flow
1. Frontend requests media list from API
2. Backend scans file system and returns JSON
3. Frontend renders grid/list view
4. User selects image
5. Detail panel shows metadata
6. Copy path button uses Clipboard API
7. Path ready for paste into timeline editor

## 7. Testing Requirements

### 7.1 Functional Tests
- Load media library page
- Switch between grid and list views
- Search for specific images
- Filter by type/size
- Copy path to clipboard
- Open full-size image
- Handle empty media directory

### 7.2 Performance Tests
- Load time with 100+ images
- Scroll performance in grid view
- Image loading optimization
- Memory usage with many images

### 7.3 Edge Cases
- Very large images (>10MB)
- Corrupted image files
- Special characters in filenames
- Deep nested folders
- Missing file permissions

## 8. Future Enhancements (Not in Priority 3)

### 8.1 Advanced Features
- Bulk operations (delete multiple)
- Image categories/tags
- Favorites/bookmarks
- Recent items section
- Search by image content (AI)

### 8.2 Organization Features
- Folder creation and management
- Move/rename files
- Automatic organization by date/type
- Team-specific folders

### 8.3 Upload Features (Priority 4)
- Drag and drop upload
- Multiple file upload
- Upload progress indication
- Automatic optimization

## 9. Acceptance Criteria

### Must Have (Priority 3)
✓ Media library page accessible from sidebar
✓ Grid view showing all images from /scenarios/media/library/
✓ List view as alternative display
✓ Click to view image details
✓ Copy path button with clipboard functionality
✓ Search by filename
✓ Basic filtering (file type)
✓ Responsive design
✓ Error handling for missing images

### Nice to Have (If Time Permits)
- Advanced filtering options
- Usage tracking
- Keyboard shortcuts
- Image zoom on hover
- Breadcrumb navigation for folders

## 10. Implementation Steps

1. **Create API endpoint** to list media files with metadata
2. **Add Media Library page** to client dashboard
3. **Implement grid view** with image thumbnails
4. **Add list view** as alternative display
5. **Create detail panel** for selected images
6. **Implement path copying** with clipboard API
7. **Add search functionality** for filenames
8. **Add basic filters** for file types
9. **Implement responsive design** for mobile
10. **Add error handling** and loading states
11. **Test with various image types and sizes**
12. **Optimize performance** for large collections

## 11. Time Estimate
- Backend API: 1-2 hours
- Frontend page structure: 1-2 hours
- Grid/List views: 2-3 hours
- Detail panel and interactions: 2-3 hours
- Search/Filter/Sort: 1-2 hours
- Testing and refinement: 1-2 hours
- **Total: 8-14 hours**

## 12. Risks and Mitigations

### Risks
1. **Performance with many images**: Browser may struggle with 100+ images
   - *Mitigation*: Implement pagination and lazy loading

2. **Large file sizes**: Loading full images as thumbnails is inefficient
   - *Mitigation*: Start simple, add thumbnail generation if needed

3. **Complex folder structures**: Deep nesting may complicate navigation
   - *Mitigation*: Flatten structure initially, add folder nav later

4. **Cross-browser compatibility**: Clipboard API varies across browsers
   - *Mitigation*: Use fallback for older browsers

5. **Mobile performance**: Grid view may be slow on mobile devices
   - *Mitigation*: Reduce images per page on mobile

## 13. Success Metrics
- Media library loads in <2 seconds with 50 images
- Path copying works on first click 100% of time
- Users can find specific images in <10 seconds
- Grid view is responsive on mobile devices
- No broken image placeholders in production
- Zero errors when media directory is empty

---

## Summary
Priority 3 delivers a functional media library that makes it easy for users to browse available images and copy their paths for use in timeline editing. The implementation focuses on core functionality with a clean, responsive interface that works well with the existing theme system. This foundation can be extended in Priority 4 with upload capabilities and in future priorities with advanced organization features.