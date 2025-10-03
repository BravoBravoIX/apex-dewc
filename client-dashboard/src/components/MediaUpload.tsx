import React, { useState, useRef } from 'react';
import { X, Upload, FileImage, AlertCircle, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface MediaUploadProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

interface SelectedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ onClose, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: JPG, PNG, GIF, SVG`;
    }

    if (file.size > maxSize) {
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB > 10MB limit)`;
    }

    return null;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: SelectedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        // Show error for invalid file
        newFiles.push({
          file,
          status: 'error',
          progress: 0,
          error
        });
      } else {
        // Create preview for valid image files
        const reader = new FileReader();
        const fileObj: SelectedFile = {
          file,
          status: 'pending',
          progress: 0
        };

        reader.onload = (e) => {
          fileObj.preview = e.target?.result as string;
          setSelectedFiles(prev => [...prev]);
        };

        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        }

        newFiles.push(fileObj);
      }
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const validFiles = selectedFiles.filter(f => f.status === 'pending');

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(f => formData.append('files', f.file));

      const response = await fetch(`${API_BASE_URL}/api/v1/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update file statuses based on response
      setSelectedFiles(prev => prev.map(sf => {
        const uploaded = result.uploaded.find((u: any) => u.original_filename === sf.file.name);
        const error = result.errors.find((e: any) => e.filename === sf.file.name);

        if (uploaded) {
          return { ...sf, status: 'success' as const, progress: 100 };
        } else if (error) {
          return { ...sf, status: 'error' as const, progress: 0, error: error.error };
        }
        return sf;
      }));

      // If any files succeeded, call completion callback
      if (result.successful > 0) {
        setTimeout(() => {
          onUploadComplete();
        }, 1500);
      }

    } catch (error) {
      // Mark all pending files as error
      setSelectedFiles(prev => prev.map(sf =>
        sf.status === 'pending'
          ? { ...sf, status: 'error' as const, error: 'Upload failed' }
          : sf
      ));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = selectedFiles.filter(f => f.status === 'pending').length;
  const successCount = selectedFiles.filter(f => f.status === 'success').length;
  const errorCount = selectedFiles.filter(f => f.status === 'error').length;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Upload Media</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Drag-and-Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface-light hover:border-primary/50'
            }`}
          >
            <Upload className="mx-auto mb-4 text-text-muted" size={48} />
            <p className="text-text-primary mb-2">Drag files here or click to browse</p>
            <p className="text-sm text-text-secondary mb-4">
              Supported: JPG, PNG, GIF, SVG (max 10MB per file)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="font-semibold text-text-primary mb-2">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {selectedFiles.map((sf, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      sf.status === 'success' ? 'border-green-500/50 bg-green-500/10' :
                      sf.status === 'error' ? 'border-red-500/50 bg-red-500/10' :
                      'border-border bg-surface-light'
                    }`}
                  >
                    {/* Preview/Icon */}
                    <div className="w-12 h-12 flex-shrink-0 rounded bg-surface flex items-center justify-center overflow-hidden">
                      {sf.preview ? (
                        <img src={sf.preview} alt={sf.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileImage size={24} className="text-text-muted" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {sf.file.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatFileSize(sf.file.size)}
                      </p>
                      {sf.error && (
                        <p className="text-xs text-red-400 mt-1">{sf.error}</p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {sf.status === 'success' && (
                        <Check size={20} className="text-green-400" />
                      )}
                      {sf.status === 'error' && (
                        <AlertCircle size={20} className="text-red-400" />
                      )}
                      {sf.status === 'pending' && !uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-surface rounded transition-colors"
                        >
                          <X size={16} className="text-text-secondary" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Summary */}
          {selectedFiles.length > 0 && (successCount > 0 || errorCount > 0) && (
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="text-sm text-text-primary">
                {successCount > 0 && (
                  <span className="text-green-400">
                    {successCount} uploaded successfully
                  </span>
                )}
                {successCount > 0 && errorCount > 0 && <span>, </span>}
                {errorCount > 0 && (
                  <span className="text-red-400">
                    {errorCount} failed
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <div className="text-sm text-text-secondary">
            {pendingCount > 0 && `${pendingCount} file${pendingCount !== 1 ? 's' : ''} ready to upload`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {successCount > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={uploadFiles}
              disabled={pendingCount === 0 || uploading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
