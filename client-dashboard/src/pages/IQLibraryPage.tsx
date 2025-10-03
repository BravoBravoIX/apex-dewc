import React, { useState, useEffect } from 'react';
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

const IQLibraryPage: React.FC = () => {
  const [iqFiles, setIqFiles] = useState<IQFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadIQFiles();
  }, []);

  const loadIQFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/iq-library');
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
      const response = await fetch(`${API_BASE_URL}/api/v1/iq-library/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully uploaded ${result.successful} file(s)`);
        loadIQFiles();
      } else if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e: any) => `${e.filename}: ${e.error}`).join('\n');
        alert(`Upload errors:\n${errorMessages}`);
        if (result.successful > 0) {
          loadIQFiles();
        }
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">IQ File Library</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage IQ files for SDR scenarios
            </p>
          </div>

          <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              IQ Files ({iqFiles.length})
            </h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading...</div>
            ) : iqFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No IQ files uploaded yet. Upload .iq, .dat, .raw, or .cfile files to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {iqFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileAudio className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-white">{file.filename}</div>
                        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
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
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Supported Formats</h2>
          </div>
          <div className="p-4">
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>.iq</strong> - Complex64 IQ samples (I/Q interleaved, 32-bit float)</li>
              <li><strong>.dat</strong> - Raw binary IQ data</li>
              <li><strong>.raw</strong> - Raw IQ samples</li>
              <li><strong>.cfile</strong> - GNU Radio complex float format</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              All files should contain complex64 samples (8 bytes per sample).
              Sample rate is assumed to be 1.024 MHz for duration calculation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IQLibraryPage;
