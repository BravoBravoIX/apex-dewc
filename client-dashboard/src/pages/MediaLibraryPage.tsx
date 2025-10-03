import React, { useState, useEffect } from 'react';
import { Search, Grid, List, Image as ImageIcon, X, Upload, Trash2 } from 'lucide-react';
import MediaUpload from '../components/MediaUpload';
import { API_BASE_URL } from '../config';

interface MediaFile {
  filename: string;
  path: string;
  size: number;
  width: number | null;
  height: number | null;
  modified: number;
  mime_type: string;
}

type ViewMode = 'grid' | 'list';

const MediaLibraryPage: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  // const [copiedPath, setCopiedPath] = useState<string | null>(null); // Commented out with Copy Path feature

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    // Filter files based on search query
    if (searchQuery.trim() === '') {
      setFilteredFiles(mediaFiles);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        mediaFiles.filter(file =>
          file.filename.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, mediaFiles]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/v1/media`);
      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }
      const data = await response.json();
      setMediaFiles(data.media);
      setFilteredFiles(data.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  // copyToClipboard function commented out - no longer needed
  // const copyToClipboard = async (path: string) => {
  //   try {
  //     await navigator.clipboard.writeText(path);
  //     setCopiedPath(path);
  //     setTimeout(() => setCopiedPath(null), 2000);
  //   } catch (err) {
  //     console.error('Failed to copy:', err);
  //   }
  // };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const deleteFile = async (file: MediaFile) => {
    try {
      setDeleting(true);
      const response = await fetch(
        `/api/v1/media?path=${encodeURIComponent(file.path)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh media library
      await fetchMedia();
      setDeleteConfirmFile(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading media library...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Media Library</h1>
            <p className="text-text-secondary">
              Browse available images to use in timeline injects
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Upload size={18} />
            Upload Media
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-light'
            }`}
            title="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-light'
            }`}
            title="List view"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-text-secondary">
        {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Empty state */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-lg card">
          <ImageIcon className="mx-auto mb-4 text-text-muted" size={48} />
          <p className="text-text-secondary mb-2">
            {searchQuery ? 'No files match your search' : 'No media files found'}
          </p>
          <p className="text-text-muted text-sm">
            {!searchQuery && 'Add images to /scenarios/media/library/ to get started'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className="bg-surface rounded-lg card overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              {/* Delete button overlay */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmFile(file);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>

              {/* Image preview */}
              <div
                className="aspect-square bg-surface-light flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(file)}
              >
                <img
                  src={file.path}
                  alt={file.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* File info */}
              <div className="p-3">
                <p className="text-sm font-medium text-text-primary truncate mb-1">
                  {file.filename}
                </p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{formatFileSize(file.size)}</span>
                  {file.width && file.height && (
                    <span>{file.width}×{file.height}</span>
                  )}
                </div>
              </div>

              {/* Copy button - COMMENTED OUT: Now using Timeline Viewer to add media to injects */}
              {/* <div className="px-3 pb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(file.path);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/80 transition-colors text-sm"
                >
                  {copiedPath === file.path ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Path
                    </>
                  )}
                </button>
              </div> */}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredFiles.length > 0 && (
        <div className="bg-surface rounded-lg card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-light border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Preview</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Filename</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Dimensions</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Size</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Modified</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFiles.map((file) => (
                <tr
                  key={file.path}
                  className="hover:bg-surface-light/50 transition-colors"
                >
                  <td className="py-2 px-4">
                    <img
                      src={file.path}
                      alt={file.filename}
                      className="w-12 h-12 object-cover rounded cursor-pointer"
                      onClick={() => setSelectedImage(file)}
                      loading="lazy"
                    />
                  </td>
                  <td className="py-2 px-4 text-sm text-text-primary font-medium">
                    {file.filename}
                  </td>
                  <td className="py-2 px-4 text-sm text-text-secondary">
                    {file.width && file.height ? `${file.width} × ${file.height}px` : '-'}
                  </td>
                  <td className="py-2 px-4 text-sm text-text-secondary">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="py-2 px-4 text-sm text-text-secondary">
                    {formatDate(file.modified)}
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setDeleteConfirmFile(file)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">
                {selectedImage.filename}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:bg-surface-light rounded transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Image Preview */}
            <div className="p-4 flex items-center justify-center bg-surface-light">
              <img
                src={selectedImage.path}
                alt={selectedImage.filename}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>

            {/* Image Details */}
            <div className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-text-secondary">Path</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={selectedImage.path}
                    readOnly
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded text-sm font-mono text-text-primary"
                  />
                  {/* Copy button - COMMENTED OUT: Now using Timeline Viewer to add media to injects */}
                  {/* <button
                    onClick={() => copyToClipboard(selectedImage.path)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
                  >
                    {copiedPath === selectedImage.path ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button> */}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Dimensions</label>
                  <p className="mt-1 text-text-primary">
                    {selectedImage.width && selectedImage.height
                      ? `${selectedImage.width} × ${selectedImage.height} pixels`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">File Size</label>
                  <p className="mt-1 text-text-primary">{formatFileSize(selectedImage.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Type</label>
                  <p className="mt-1 text-text-primary">{selectedImage.mime_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Modified</label>
                  <p className="mt-1 text-text-primary">{formatDate(selectedImage.modified)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <MediaUpload
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
            fetchMedia(); // Refresh library
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirmFile(null)}
        >
          <div
            className="bg-surface rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Delete File?
            </h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete <span className="font-medium text-text-primary">{deleteConfirmFile.filename}</span>?
              This action cannot be undone.
            </p>

            {/* File preview */}
            <div className="mb-4 rounded overflow-hidden bg-surface-light">
              <img
                src={deleteConfirmFile.path}
                alt={deleteConfirmFile.filename}
                className="w-full max-h-48 object-contain"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmFile(null)}
                disabled={deleting}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFile(deleteConfirmFile)}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibraryPage;
