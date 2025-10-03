import React from 'react';

interface ActionEditorProps {
  action: any;
  onChange: (action: any) => void;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action }) => {
  return (
    <div className="bg-surface border border-border rounded p-3 opacity-50 cursor-not-allowed">
      <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
        <p className="text-sm font-semibold text-yellow-400">🚧 Feature Under Development</p>
        <p className="text-xs text-text-muted mt-1">
          Action triggers (alerts, notifications, highlights, sounds) are coming soon.
          For now, focus on content and media. Existing actions are preserved but cannot be edited.
        </p>
      </div>

      {action ? (
        <div className="bg-surface-light border border-border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-secondary">
              Current Action (Read-Only)
            </label>
          </div>
          <div className="text-sm text-text-primary">
            <p><span className="font-semibold">Type:</span> {action.type}</p>
            {action.data && (
              <div className="mt-2 text-xs text-text-secondary">
                <p className="font-semibold">Data:</p>
                <pre className="bg-surface p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(action.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-muted text-center py-3">
          No action trigger set
        </div>
      )}
    </div>
  );
};

export default ActionEditor;
