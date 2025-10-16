import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, X, Send, Trash2, ImagePlus } from 'lucide-react';
import { API_BASE_URL } from '../config';
import MediaUpload from '../components/MediaUpload';

interface StagedInject {
  id: string;
  media: string[];
  type: string;
  content: {
    headline: string;
    body: string;
    source: string;
  };
  targetTeams: string[];
  sent: boolean;
  sentAt?: number;
}

interface MediaFile {
  filename: string;
  path: string;
  size: number;
  modified: string;
}

interface Team {
  id: string;
  name: string;
}

interface ScenarioData {
  id: string;
  name: string;
  teams: Team[];
}

const LiveInjectsPage = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [stagedInjects, setStagedInjects] = useState<StagedInject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [injectType, setInjectType] = useState('news');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // Load scenario and media on mount
  useEffect(() => {
    loadScenario();
    loadMedia();
    loadStagedInjects();
  }, [scenarioId]);

  // Save staged injects to localStorage whenever they change
  useEffect(() => {
    if (scenarioId) {
      localStorage.setItem(`live-injects-${scenarioId}`, JSON.stringify(stagedInjects));
    }
  }, [stagedInjects, scenarioId]);

  const loadScenario = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scenarios/${scenarioId}`);
      const data = await response.json();
      setScenario(data);
    } catch (error) {
      console.error('Failed to load scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media`);
      const data = await response.json();
      setMediaFiles(data.media || []);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const loadStagedInjects = () => {
    if (scenarioId) {
      const saved = localStorage.getItem(`live-injects-${scenarioId}`);
      if (saved) {
        setStagedInjects(JSON.parse(saved));
      }
    }
  };

  const handleUploadComplete = async () => {
    // Store current media paths to detect new uploads
    const existingPaths = mediaFiles.map(f => f.path);

    // Reload media to get updated list
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/media`);
      const data = await response.json();
      const updatedMedia = data.media || [];
      setMediaFiles(updatedMedia);

      // Find newly uploaded files and auto-select them
      const newFiles = updatedMedia.filter((file: MediaFile) => !existingPaths.includes(file.path));
      const newPaths = newFiles.map((file: MediaFile) => file.path);

      // Add new files to selection
      setSelectedMedia(prev => [...prev, ...newPaths]);
    } catch (error) {
      console.error('Failed to load media after upload:', error);
    }

    setShowUploadModal(false);
  };

  const toggleMediaSelection = (path: string) => {
    setSelectedMedia(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const stageInject = () => {
    if (!headline.trim() || selectedTeams.length === 0) {
      alert('Please provide a headline and select at least one team');
      return;
    }

    const newInject: StagedInject = {
      id: `staged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      media: [...selectedMedia],
      type: injectType,
      content: {
        headline,
        body,
        source
      },
      targetTeams: [...selectedTeams],
      sent: false
    };

    setStagedInjects(prev => [...prev, newInject]);

    // Clear form but keep type and teams for next inject
    setSelectedMedia([]);
    setHeadline('');
    setBody('');
    setSource('');
  };

  const removeInject = (id: string) => {
    setStagedInjects(prev => prev.filter(inject => inject.id !== id));
  };

  const clearAll = () => {
    if (confirm('Remove all unsent staged injects?')) {
      setStagedInjects(prev => prev.filter(inject => inject.sent));
    }
  };

  const sendInject = async (inject: StagedInject) => {
    if (inject.sent) return;

    const teamNames = inject.targetTeams
      .map(id => scenario?.teams.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    if (!confirm(`Send "${inject.content.headline}" to ${teamNames}?`)) {
      return;
    }

    setSending(inject.id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/exercises/${scenarioId}/inject/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_ids: inject.targetTeams,
          type: inject.type,
          content: inject.content,
          media: inject.media
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send inject');
      }

      // Mark as sent
      setStagedInjects(prev =>
        prev.map(si => si.id === inject.id ? { ...si, sent: true, sentAt: Date.now() } : si)
      );

      alert('Inject sent successfully!');
    } catch (error: any) {
      alert(`Failed to send inject: ${error.message}`);
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading...</div>;
  }

  if (!scenario) {
    return <div className="text-text-secondary">Scenario not found</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Live Injects</h1>
          <p className="text-text-secondary">Scenario: {scenario.name}</p>
        </div>
        <Link
          to={`/scenarios/${scenarioId}`}
          className="px-4 py-2 bg-surface border border-border text-text-primary rounded hover:bg-surface-light"
        >
          ← Back to Workspace
        </Link>
      </div>

      {/* Staging Form */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Prepare New Inject</h2>

        {/* Media Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              Media Files (optional)
            </label>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/80"
            >
              <ImagePlus size={16} />
              Upload New
            </button>
          </div>
          <div className="grid grid-cols-6 gap-3 max-h-64 overflow-y-auto border border-border rounded p-3">
            {mediaFiles.map(file => (
              <div
                key={file.path}
                onClick={() => toggleMediaSelection(file.path)}
                className={`relative cursor-pointer border-2 rounded transition-all ${
                  selectedMedia.includes(file.path)
                    ? 'border-primary shadow-lg'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <img
                  src={`${API_BASE_URL}${file.path}`}
                  alt={file.filename}
                  className="w-full h-20 object-cover rounded"
                />
                {selectedMedia.includes(file.path) && (
                  <div className="absolute top-1 right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedMedia.length > 0 && (
            <p className="text-sm text-text-secondary mt-2">{selectedMedia.length} file(s) selected</p>
          )}
        </div>

        {/* Inject Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
            <select
              value={injectType}
              onChange={(e) => setInjectType(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
            >
              <option value="news">News</option>
              <option value="social">Social Media</option>
              <option value="intel">Intelligence</option>
              <option value="alert">Alert</option>
              <option value="update">Update</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Reuters, Facebook"
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">Headline *</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Enter headline"
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter body text"
            rows={4}
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary"
          />
        </div>

        {/* Team Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">Target Teams *</label>
          <div className="grid grid-cols-3 gap-2">
            {scenario.teams.map(team => (
              <label
                key={team.id}
                className="flex items-center space-x-2 p-2 bg-surface border border-border rounded cursor-pointer hover:bg-surface-light"
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team.id)}
                  onChange={() => toggleTeamSelection(team.id)}
                  className="form-checkbox"
                />
                <span className="text-text-primary">{team.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={stageInject}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded hover:bg-primary/80"
        >
          <Upload size={18} />
          Stage Inject
        </button>
      </div>

      {/* Staged Injects Queue */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">
            Staged Injects ({stagedInjects.filter(si => !si.sent).length} pending)
          </h2>
          {stagedInjects.some(si => !si.sent) && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>

        {stagedInjects.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No staged injects yet</p>
        ) : (
          <div className="space-y-3">
            {stagedInjects.map(inject => (
              <div
                key={inject.id}
                className={`border rounded p-4 ${
                  inject.sent ? 'border-green-500 bg-green-900/10' : 'border-border bg-surface'
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {inject.media.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={`${API_BASE_URL}${inject.media[0]}`}
                        alt="Inject media"
                        className="w-24 h-24 object-cover rounded"
                      />
                      {inject.media.length > 1 && (
                        <p className="text-xs text-text-muted mt-1">+{inject.media.length - 1} more</p>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{inject.content.headline}</h3>
                    {inject.content.body && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{inject.content.body}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-text-muted">
                      <span>Type: {inject.type}</span>
                      {inject.content.source && <span>Source: {inject.content.source}</span>}
                      <span>
                        Teams: {inject.targetTeams.map(id => scenario.teams.find(t => t.id === id)?.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-start">
                    {inject.sent ? (
                      <div className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
                        <span>✓ Sent</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => sendInject(inject)}
                        disabled={sending === inject.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {sending === inject.id ? 'Sending...' : 'Send Now'}
                      </button>
                    )}
                    <button
                      onClick={() => removeInject(inject.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <MediaUpload
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default LiveInjectsPage;
