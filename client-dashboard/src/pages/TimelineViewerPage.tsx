import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Save, AlertCircle, Clock, Image, Zap, Plus, X, Edit2, PlusCircle, Trash2 } from 'lucide-react';
import InjectEditor from '../components/InjectEditor';
import { API_BASE_URL } from '../config';

interface Inject {
  id: string;
  time: number;
  type: string;
  priority?: string;
  content?: any;
  media?: string[];
  action?: {
    type: string;
    data?: any;
  };
}

interface Timeline {
  id: string;
  name: string;
  description: string;
  version: string;
  injects: Inject[];
}

interface MediaFile {
  filename: string;
  path: string;
  size: number;
  width: number | null;
  height: number | null;
  modified: number;
  mime_type: string;
}

const TimelineViewerPage: React.FC = () => {
  const { scenarioId, teamId } = useParams<{ scenarioId: string; teamId: string }>();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [editedInjects, setEditedInjects] = useState<Map<string, number>>(new Map());
  const [editedMedia, setEditedMedia] = useState<Map<string, string[]>>(new Map());
  const [editedContent, setEditedContent] = useState<Map<string, any>>(new Map());
  const [editedPriority, setEditedPriority] = useState<Map<string, string | undefined>>(new Map());
  const [editedActions, setEditedActions] = useState<Map<string, any>>(new Map());
  const [editedTypes, setEditedTypes] = useState<Map<string, string>>(new Map());
  const [timeInputs, setTimeInputs] = useState<Map<string, string>>(new Map());
  const [expandedInject, setExpandedInject] = useState<string | null>(null);
  const [creatingNewInject, setCreatingNewInject] = useState(false);
  const [newInject, setNewInject] = useState<Inject | null>(null);
  const [deleteConfirmInject, setDeleteConfirmInject] = useState<Inject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [selectedInjectForMedia, setSelectedInjectForMedia] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [scenarioId, teamId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch timeline data from the API
      const response = await fetch(`http://localhost:8001/api/v1/timelines/${scenarioId}/${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();
      setTimeline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string): number | null => {
    const match = timeStr.match(/^(\d+):(\d{0,2})$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2] || '0');
      if (seconds < 60) {
        return minutes * 60 + seconds;
      }
    }
    const minutesOnly = timeStr.match(/^(\d+)$/);
    if (minutesOnly) {
      return parseInt(minutesOnly[1]) * 60;
    }
    return null;
  };

  const handleTimeInputChange = (injectId: string, value: string) => {
    setTimeInputs(prev => new Map(prev).set(injectId, value));

    const seconds = parseTime(value);
    if (seconds !== null) {
      setEditedInjects(prev => new Map(prev).set(injectId, seconds));
    } else {
      setEditedInjects(prev => {
        const newMap = new Map(prev);
        newMap.delete(injectId);
        return newMap;
      });
    }
  };

  const fetchMediaFiles = async () => {
    try {
      setLoadingMedia(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/media`);
      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }
      const data = await response.json();
      setMediaFiles(data.media);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const openMediaBrowser = (injectId: string) => {
    setSelectedInjectForMedia(injectId);
    setShowMediaBrowser(true);
    if (mediaFiles.length === 0) {
      fetchMediaFiles();
    }
  };

  const closeMediaBrowser = () => {
    setShowMediaBrowser(false);
    setSelectedInjectForMedia(null);
  };

  const addMediaToInject = (injectId: string, mediaPath: string) => {
    const inject = timeline?.injects.find(i => i.id === injectId);
    if (!inject) return;

    const currentMedia = editedMedia.get(injectId) || inject.media || [];
    if (currentMedia.includes(mediaPath)) return; // Already added

    const newMedia = [...currentMedia, mediaPath];
    setEditedMedia(prev => new Map(prev).set(injectId, newMedia));
    closeMediaBrowser();
  };

  const removeMediaFromInject = (injectId: string, mediaPath: string) => {
    const inject = timeline?.injects.find(i => i.id === injectId);
    if (!inject) return;

    const currentMedia = editedMedia.get(injectId) || inject.media || [];
    const newMedia = currentMedia.filter(path => path !== mediaPath);
    setEditedMedia(prev => new Map(prev).set(injectId, newMedia));
  };

  const getInjectMedia = (inject: Inject): string[] => {
    return editedMedia.get(inject.id) || inject.media || [];
  };

  const hasChanges = () => editedInjects.size > 0 || editedMedia.size > 0 || editedContent.size > 0 || editedPriority.size > 0 || editedActions.size > 0 || editedTypes.size > 0;

  const saveChanges = async () => {
    if (!timeline || !hasChanges()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare updated timeline
      const updatedTimeline = {
        ...timeline,
        injects: timeline.injects.map(inject => {
          const updatedInject: any = {
            ...inject,
            time: editedInjects.has(inject.id) ? editedInjects.get(inject.id)! : inject.time
          };

          // Update media if changed
          if (editedMedia.has(inject.id)) {
            const newMedia = editedMedia.get(inject.id)!;
            if (newMedia.length > 0) {
              updatedInject.media = newMedia;
            } else {
              delete updatedInject.media;
            }
          }

          // Update content if changed
          if (editedContent.has(inject.id)) {
            updatedInject.content = editedContent.get(inject.id);
          }

          // Update priority if changed
          if (editedPriority.has(inject.id)) {
            const newPriority = editedPriority.get(inject.id);
            if (newPriority) {
              updatedInject.priority = newPriority;
            } else {
              delete updatedInject.priority;
            }
          }

          // Update action if changed
          if (editedActions.has(inject.id)) {
            const newAction = editedActions.get(inject.id);
            if (newAction) {
              updatedInject.action = newAction;
            } else {
              delete updatedInject.action;
            }
          }

          // Update type if changed
          if (editedTypes.has(inject.id)) {
            updatedInject.type = editedTypes.get(inject.id);
          }

          return updatedInject;
        })
      };

      // Save to backend
      const response = await fetch(`http://localhost:8001/api/v1/timelines/${scenarioId}/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTimeline),
      });

      if (!response.ok) {
        throw new Error('Failed to save timeline');
      }

      // Update local state
      setTimeline(updatedTimeline);
      setEditedInjects(new Map());
      setEditedMedia(new Map());
      setEditedContent(new Map());
      setEditedPriority(new Map());
      setEditedActions(new Map());
      setEditedTypes(new Map());
      setTimeInputs(new Map());
      setExpandedInject(null);
      setSuccessMessage('Timeline saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save timeline');
    } finally {
      setSaving(false);
    }
  };

  const getInjectTypeLabel = (type: string) => {
    return type.toUpperCase();
  };

  const handleInjectEditorSave = (injectId: string, updates: {
    content?: any;
    priority?: string | undefined;
    action?: any;
    type?: string;
  }) => {
    if (updates.content !== undefined) {
      setEditedContent(prev => new Map(prev).set(injectId, updates.content));
    }
    if (updates.priority !== undefined || updates.priority === undefined) {
      setEditedPriority(prev => new Map(prev).set(injectId, updates.priority));
    }
    if (updates.action !== undefined || updates.action === undefined) {
      setEditedActions(prev => new Map(prev).set(injectId, updates.action));
    }
    if (updates.type !== undefined) {
      setEditedTypes(prev => new Map(prev).set(injectId, updates.type!));
    }
    setExpandedInject(null);
  };

  const handleInjectEditorCancel = () => {
    setExpandedInject(null);
  };

  const handleCreateNewInject = () => {
    const newId = `inject-${Date.now()}`;
    const inject: Inject = {
      id: newId,
      time: 0,
      type: 'news',
      content: {},
      media: []
    };
    setNewInject(inject);
    setCreatingNewInject(true);
  };

  const handleNewInjectSave = (updates: {
    content?: any;
    priority?: string | undefined;
    action?: any;
    type?: string;
  }) => {
    if (!newInject || !timeline) return;

    // Create the final inject with all updates
    const finalInject: Inject = {
      ...newInject,
      type: updates.type || newInject.type,
      content: updates.content || {},
      priority: updates.priority,
      action: updates.action
    };

    // Add to timeline
    const updatedTimeline = {
      ...timeline,
      injects: [...timeline.injects, finalInject]
    };

    setTimeline(updatedTimeline);
    setCreatingNewInject(false);
    setNewInject(null);

    // Mark as changed so Save button appears
    setEditedInjects(prev => new Map(prev).set(finalInject.id, finalInject.time));
    setSuccessMessage('New inject created! Click "Save Changes" to persist.');
  };

  const handleNewInjectCancel = () => {
    setCreatingNewInject(false);
    setNewInject(null);
  };

  const handleDeleteInject = (inject: Inject) => {
    setDeleteConfirmInject(inject);
  };

  const confirmDeleteInject = () => {
    if (!deleteConfirmInject || !timeline) return;

    const updatedTimeline = {
      ...timeline,
      injects: timeline.injects.filter(i => i.id !== deleteConfirmInject.id)
    };

    setTimeline(updatedTimeline);
    setDeleteConfirmInject(null);

    // Clear any edits for this inject
    setEditedInjects(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });
    setEditedMedia(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });
    setEditedContent(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });
    setEditedPriority(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });
    setEditedActions(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });
    setEditedTypes(prev => {
      const newMap = new Map(prev);
      newMap.delete(deleteConfirmInject.id);
      return newMap;
    });

    // Mark timeline as changed
    if (!hasChanges()) {
      // Force a change marker if nothing else is changed
      setEditedInjects(prev => new Map(prev).set('__deleted__', 0));
    }

    setSuccessMessage('Inject deleted! Click "Save Changes" to persist.');
  };

  const cancelDeleteInject = () => {
    setDeleteConfirmInject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} />
          {error}
        </div>
        <Link to={`/scenarios/${scenarioId}`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
          <ChevronLeft size={16} />
          Back to Scenario
        </Link>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="text-text-secondary">No timeline data available</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to={`/scenarios/${scenarioId}`} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
          <ChevronLeft size={16} />
          Back to Scenario
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{timeline.name}</h1>
            <p className="text-text-secondary">{timeline.description}</p>
            <div className="mt-2 text-sm text-text-secondary">
              Scenario: <span className="text-text-primary">{scenarioId}</span> |
              Team: <span className="text-text-primary capitalize">{teamId}</span> |
              Version: <span className="text-text-primary">{timeline.version}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateNewInject}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusCircle size={16} />
              Add New Inject
            </button>
            {hasChanges() && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 text-green-400 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* New Inject Editor */}
      {creatingNewInject && newInject && (
        <div className="mb-4 bg-surface rounded-lg card overflow-hidden">
          <div className="bg-green-900/20 border-l-4 border-green-500 p-3">
            <h3 className="font-semibold text-green-400">Creating New Inject</h3>
            <p className="text-sm text-text-muted">Fill in the fields below and click Save to add this inject to the timeline.</p>
          </div>
          <InjectEditor
            inject={newInject}
            onSave={handleNewInjectSave}
            onCancel={handleNewInjectCancel}
          />
        </div>
      )}

      {/* Timeline Grid */}
      <div className="bg-surface rounded-lg card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-light font-semibold text-sm text-text-primary border-b border-border">
          <div className="col-span-1 flex items-center gap-1">
            <Clock size={14} />
            Time
          </div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">ID</div>
          <div className="col-span-5">Content</div>
          <div className="col-span-2">Media</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {timeline.injects
            .sort((a, b) => {
              const timeA = editedInjects.get(a.id) ?? a.time;
              const timeB = editedInjects.get(b.id) ?? b.time;
              return timeA - timeB;
            })
            .map((inject) => {
              const currentTime = editedInjects.get(inject.id) ?? inject.time;
              const isEdited = editedInjects.has(inject.id) || editedMedia.has(inject.id) ||
                               editedContent.has(inject.id) || editedPriority.has(inject.id) ||
                               editedActions.has(inject.id) || editedTypes.has(inject.id);
              const inputValue = timeInputs.get(inject.id) ?? formatTime(currentTime);
              const injectMedia = getInjectMedia(inject);
              const currentType = editedTypes.get(inject.id) || inject.type;

              return (
                <React.Fragment key={inject.id}>
                  <div className={`grid grid-cols-12 gap-4 p-4 hover:bg-surface-light/50 ${isEdited ? 'bg-yellow-500/10' : ''}`}>
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => handleTimeInputChange(inject.id, e.target.value)}
                      className={`w-full px-2 py-1 bg-surface border rounded text-sm font-mono text-text-primary ${
                        isEdited ? 'border-yellow-500 bg-yellow-500/20' : 'border-border'
                      } focus:outline-none focus:border-primary`}
                      placeholder="M:SS"
                    />
                  </div>

                  <div className="col-span-1 flex items-center">
                    <span className={`text-xs font-semibold ${editedTypes.has(inject.id) ? 'text-yellow-400' : 'text-primary'}`}>
                      {getInjectTypeLabel(currentType)}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm">
                    <div className="font-mono text-xs text-text-secondary">{inject.id}</div>
                    {inject.priority && (
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                        inject.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        inject.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-surface-light text-text-secondary'
                      }`}>
                        {inject.priority}
                      </span>
                    )}
                  </div>

                  <div className="col-span-5 text-sm">
                    {inject.content && (
                      <div>
                        {typeof inject.content === 'string' ? (
                          <p className="text-text-primary">{inject.content}</p>
                        ) : (
                          <div>
                            {inject.content.headline && (
                              <p className="font-semibold text-text-primary">{inject.content.headline}</p>
                            )}
                            {inject.content.body && (
                              <p className="text-text-secondary mt-1">{inject.content.body}</p>
                            )}
                            {inject.content.text && (
                              <p className="text-text-secondary mt-1 italic">"{inject.content.text}"</p>
                            )}
                            {inject.content.source && (
                              <p className="text-xs text-text-muted mt-1">Source: {inject.content.source}</p>
                            )}
                            {inject.content.platform && (
                              <p className="text-xs text-text-muted mt-1">
                                Platform: {inject.content.platform}
                                {inject.content.username && ` - ${inject.content.username}`}
                              </p>
                            )}
                            {inject.content.command && (
                              <p className="font-mono text-xs bg-surface-light p-1 rounded mt-1">
                                Command: {inject.content.command}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Media Column */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      {injectMedia.map((mediaPath, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-surface-light px-2 py-1 rounded group">
                          <Image size={12} className="text-primary flex-shrink-0" />
                          <span className="text-text-secondary truncate flex-1" title={mediaPath}>
                            {mediaPath.split('/').pop()}
                          </span>
                          <button
                            onClick={() => removeMediaFromInject(inject.id, mediaPath)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} className="text-red-400 hover:text-red-300" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => openMediaBrowser(inject.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus size={12} />
                        Add Media
                      </button>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    {inject.action && (
                      <div className="flex items-center gap-1 text-accent" title={`Action: ${inject.action.type}`}>
                        <Zap size={14} />
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedInject(expandedInject === inject.id ? null : inject.id)}
                      className="p-1 hover:bg-surface-light rounded transition-colors"
                      title="Edit inject"
                    >
                      <Edit2 size={14} className="text-primary hover:text-primary/80" />
                    </button>
                    <button
                      onClick={() => handleDeleteInject(inject)}
                      className="p-1 hover:bg-red-900/30 rounded transition-colors"
                      title="Delete inject"
                    >
                      <Trash2 size={14} className="text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                  </div>

                  {/* Expandable Editor */}
                  {expandedInject === inject.id && (
                    <div className="col-span-12">
                      <InjectEditor
                        inject={inject}
                        onSave={(updates) => handleInjectEditorSave(inject.id, updates)}
                        onCancel={handleInjectEditorCancel}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-surface rounded-lg card">
        <h3 className="font-semibold text-text-primary mb-2">Quick Guide</h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>Click on any time field to edit it (format: M:SS)</li>
          <li>Click the <Edit2 size={12} className="inline" /> icon to edit inject content, priority, and actions</li>
          <li>Click "Add Media" to attach images to injects</li>
          <li>Hover over media and click X to remove</li>
          <li>Changed items will be highlighted in yellow</li>
          <li>Click "Save Changes" to persist your edits</li>
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmInject && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={cancelDeleteInject}
        >
          <div
            className="bg-surface rounded-lg max-w-md w-full p-6 border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Delete Inject?
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to delete inject{' '}
              <span className="font-mono text-primary">{deleteConfirmInject.id}</span>?
            </p>
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-xs font-semibold text-red-400">⚠ Warning</p>
              <p className="text-xs text-text-muted mt-1">
                This will permanently remove the inject from the timeline. This cannot be undone after saving.
              </p>
            </div>

            {deleteConfirmInject.content && (
              <div className="mb-4 p-3 bg-surface-light rounded text-xs">
                <p className="font-semibold text-text-primary mb-1">Preview:</p>
                {typeof deleteConfirmInject.content === 'string' ? (
                  <p className="text-text-secondary">{deleteConfirmInject.content}</p>
                ) : (
                  <div className="text-text-secondary">
                    {deleteConfirmInject.content.headline && (
                      <p className="font-semibold">{deleteConfirmInject.content.headline}</p>
                    )}
                    {deleteConfirmInject.content.text && (
                      <p className="italic">"{deleteConfirmInject.content.text}"</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDeleteInject}
                className="px-4 py-2 bg-surface text-text-primary rounded hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Inject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Browser Modal */}
      {showMediaBrowser && selectedInjectForMedia && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeMediaBrowser}
        >
          <div
            className="bg-surface rounded-lg max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">
                Select Media for Inject
              </h3>
              <button
                onClick={closeMediaBrowser}
                className="p-1 hover:bg-surface-light rounded transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-auto p-4">
              {loadingMedia ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-text-secondary">Loading media...</div>
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Image className="mx-auto mb-2 text-text-muted" size={48} />
                    <p className="text-text-secondary">No media files available</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaFiles.map((file) => (
                    <div
                      key={file.path}
                      className="bg-surface-light rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                      onClick={() => addMediaToInject(selectedInjectForMedia, file.path)}
                    >
                      {/* Image preview */}
                      <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
                        <img
                          src={`http://localhost:8001${file.path}`}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* File info */}
                      <div className="p-3">
                        <p className="text-sm font-medium text-text-primary truncate" title={file.filename}>
                          {file.filename}
                        </p>
                        <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                          <span>
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(0)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                          {file.width && file.height && (
                            <span>{file.width}×{file.height}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-light">
              <p className="text-sm text-text-secondary">
                Click on an image to add it to the inject
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineViewerPage;