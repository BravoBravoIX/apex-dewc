import React from 'react';

interface PrioritySelectorProps {
  value: string | undefined;
  onChange: (priority: string | undefined) => void;
}

const PrioritySelector: React.FC<PrioritySelectorProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue === '' ? undefined : newValue);
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        Priority
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        className={`w-full px-3 py-2 bg-surface border rounded text-text-primary focus:outline-none focus:border-primary ${
          value ? getPriorityColor(value) : 'border-border'
        }`}
      >
        <option value="">None</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {value && (
        <div className="mt-2">
          <span className={`inline-block px-3 py-1 text-xs rounded-full ${
            value === 'high' ? 'bg-red-500/20 text-red-400' :
            value === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {value.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PrioritySelector;
