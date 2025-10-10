import React from 'react';

interface ContentEditorProps {
  type: string;
  content: any;
  onChange: (content: any) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ type, content, onChange }) => {
  const handleFieldChange = (field: string, value: string) => {
    onChange({
      ...content,
      [field]: value
    });
  };

  const renderFields = () => {
    switch (type) {
      case 'news':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Headline <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Enter headline"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.headline || '').length} / 200 characters
              </p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Source <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.source || ''}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="e.g., BBC News, Reuters"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Body <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Enter article body"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.body || '').length} / 5000 characters
              </p>
            </div>
          </>
        );

      case 'social':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Platform
              </label>
              <select
                value={content.platform || ''}
                onChange={(e) => handleFieldChange('platform', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Auto-detect (default: Twitter)</option>
                <option value="twitter">Twitter / X</option>
                <option value="facebook">Facebook</option>
              </select>
              <p className="text-xs text-text-muted mt-1">
                Optional - used for image generation
              </p>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Headline
              </label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Short title or topic"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Source <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.source || ''}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="@username or User Name"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Body <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Post content"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.body || '').length} / 1000 characters
              </p>
            </div>
          </>
        );

      case 'social_media':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Platform <span className="text-red-400">*</span>
              </label>
              <select
                value={content.platform || ''}
                onChange={(e) => handleFieldChange('platform', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select platform...</option>
                <option value="twitter">Twitter / X</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.username || ''}
                onChange={(e) => handleFieldChange('username', e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="@username or User Name"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Post Text <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Enter post content"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.text || '').length} / 1000 characters
              </p>
            </div>
          </>
        );

      case 'email':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                From <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.from || ''}
                onChange={(e) => handleFieldChange('from', e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="sender@example.com or Sender Name"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.subject || ''}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Email subject"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Body <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Email body"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.body || '').length} / 5000 characters
              </p>
            </div>
          </>
        );

      case 'sms':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                From <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.from || ''}
                onChange={(e) => handleFieldChange('from', e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Phone number or sender name"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.text || ''}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="SMS message content"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.text || '').length} / 500 characters
              </p>
            </div>
          </>
        );

      case 'intelligence':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Headline <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.headline || ''}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
                placeholder="Intelligence brief title"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Classification
              </label>
              <select
                value={content.classification || ''}
                onChange={(e) => handleFieldChange('classification', e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select classification...</option>
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="SECRET">SECRET</option>
                <option value="TOP SECRET">TOP SECRET</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Intelligence Details <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content.body || ''}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Detailed intelligence information"
              />
              <p className="text-xs text-text-muted mt-1">
                {(content.body || '').length} / 5000 characters
              </p>
            </div>
          </>
        );

      case 'system':
        return (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Command <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={content.command || ''}
                onChange={(e) => handleFieldChange('command', e.target.value)}
                maxLength={500}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary font-mono text-sm"
                placeholder="Command to display/execute"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                maxLength={1000}
                rows={2}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Optional description"
              />
            </div>
          </>
        );

      default:
        return (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-sm text-yellow-400">
              Unknown inject type: <span className="font-mono">{type}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">
              This inject type doesn't have a specific editor. Content will be preserved as-is.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded p-3">
      {renderFields()}
    </div>
  );
};

export default ContentEditor;
