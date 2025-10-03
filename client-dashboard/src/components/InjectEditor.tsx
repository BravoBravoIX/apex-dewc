import React, { useState } from 'react';
import { X } from 'lucide-react';
import ContentEditor from './ContentEditor';
import PrioritySelector from './PrioritySelector';
import ActionEditor from './ActionEditor';

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

interface InjectEditorProps {
  inject: Inject;
  onSave: (updates: {
    content?: any;
    priority?: string | undefined;
    action?: any;
    type?: string;
  }) => void;
  onCancel: () => void;
}

const InjectEditor: React.FC<InjectEditorProps> = ({ inject, onSave, onCancel }) => {
  const [type, setType] = useState(inject.type);
  const [content, setContent] = useState(inject.content || {});
  const [priority, setPriority] = useState<string | undefined>(inject.priority);
  const [action, setAction] = useState(inject.action);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTypeChangeConfirm, setShowTypeChangeConfirm] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const handleTypeChange = (newType: string) => {
    if (newType === type) return;

    setPendingType(newType);
    setShowTypeChangeConfirm(true);
  };

  const confirmTypeChange = () => {
    if (!pendingType) return;

    setType(pendingType);
    setContent({}); // Reset content when type changes
    setShowTypeChangeConfirm(false);
    setPendingType(null);
    setValidationErrors([]);
  };

  const cancelTypeChange = () => {
    setShowTypeChangeConfirm(false);
    setPendingType(null);
  };

  const handleSave = () => {
    // Validate before saving
    const errors: string[] = [];

    // Validate required fields based on type
    const requiredFields = getRequiredFields(type);
    requiredFields.forEach(field => {
      if (!content[field] || content[field].trim() === '') {
        errors.push(`${field} is required for ${type} injects`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Save changes
    onSave({
      content,
      priority,
      action,
      type: type !== inject.type ? type : undefined
    });
  };

  const getRequiredFields = (type: string): string[] => {
    switch (type) {
      case 'news':
        return ['headline', 'body', 'source'];
      case 'social_media':
        return ['platform', 'username', 'text'];
      case 'email':
        return ['subject', 'from', 'body'];
      case 'sms':
        return ['from', 'text'];
      case 'intelligence':
        return ['headline', 'body'];
      case 'system':
        return ['command'];
      default:
        return [];
    }
  };

  return (
    <div className="bg-surface-light border-t border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-text-primary">
          Editing: {inject.id}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-surface rounded transition-colors"
        >
          <X size={16} className="text-text-secondary" />
        </button>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
          <p className="text-sm font-semibold text-red-400 mb-1">Validation Errors:</p>
          <ul className="text-sm text-red-400 list-disc list-inside">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="news">News</option>
            <option value="social_media">Social Media</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="intelligence">Intelligence</option>
            <option value="system">System</option>
          </select>
          {type !== inject.type && (
            <p className="text-xs text-yellow-400 mt-1">⚠ Type changed - content was reset</p>
          )}
        </div>

        <PrioritySelector
          value={priority}
          onChange={setPriority}
        />
      </div>

      {/* Type Change Confirmation Modal */}
      {showTypeChangeConfirm && pendingType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Change Inject Type?
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Changing from <span className="font-semibold text-primary">{type}</span> to{' '}
              <span className="font-semibold text-primary">{pendingType}</span> will reset all content fields.
            </p>
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-xs font-semibold text-yellow-400">⚠ Warning</p>
              <p className="text-xs text-text-muted mt-1">
                Your current content will be cleared. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelTypeChange}
                className="px-4 py-2 bg-surface text-text-primary rounded hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTypeChange}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Change Type
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Content
        </label>
        <ContentEditor
          type={type}
          content={content}
          onChange={setContent}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Action Trigger
        </label>
        <ActionEditor
          action={action}
          onChange={setAction}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface text-text-primary rounded hover:bg-surface-light transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-background rounded hover:bg-primary/80 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default InjectEditor;
