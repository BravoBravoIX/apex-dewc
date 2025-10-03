export interface ThreatData {
  emitterType: string;
  threatCategory: 'Unknown' | 'Hostile' | 'Friendly' | 'Neutral';
  confidenceLevel: number; // 0-100
  systemName?: string;
  natoDesignation?: string;
  manufacturer?: string;
  characteristics?: Array<{ label: string; value: string }>;
}

interface ThreatClassificationProps {
  threat: ThreatData | null;
}

export const ThreatClassification = ({ threat }: ThreatClassificationProps) => {
  const getThreatCategoryClass = (category: string) => {
    switch (category) {
      case 'Hostile':
        return 'text-error';
      case 'Friendly':
        return 'text-success';
      case 'Neutral':
        return 'text-warning';
      default:
        return 'text-text-secondary';
    }
  };

  if (!threat) {
    return (
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Classification Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">
                Threat Classification
              </h2>
            </div>
            <div className="text-center py-8 text-text-secondary">
              No threat data available
            </div>
          </div>

          {/* System Intelligence Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">
                System Intelligence
              </h2>
            </div>
            <div className="text-center py-8 text-text-secondary">
              No system intelligence available
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Classification Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Threat Classification
            </h2>
          </div>

          <div className="space-y-4">
            {/* Emitter Type */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Emitter Type
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {threat.emitterType}
              </div>
            </div>

            {/* Threat Category */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Threat Category
              </div>
              <div className={`text-lg font-semibold ${getThreatCategoryClass(threat.threatCategory)}`}>
                {threat.threatCategory}
              </div>
            </div>

            {/* Confidence Level */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Confidence Level
              </div>
              <div className="text-lg font-semibold text-text-primary mb-2">
                {threat.confidenceLevel}%
              </div>
              {/* Confidence Meter */}
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warning to-success transition-all duration-500"
                  style={{ width: `${threat.confidenceLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Emitter Characteristics */}
          {threat.characteristics && threat.characteristics.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm text-text-muted uppercase tracking-wide mb-3">
                Emitter Characteristics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {threat.characteristics.map((char, index) => (
                  <div key={index} className="p-3 bg-background rounded">
                    <div className="text-xs text-text-muted mb-1">
                      {char.label}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {char.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Intelligence Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              System Intelligence
            </h2>
          </div>

          <div className="space-y-4">
            {/* System Name */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                System Name
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {threat.systemName || '--'}
              </div>
            </div>

            {/* NATO Designation */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                NATO Designation
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {threat.natoDesignation || '--'}
              </div>
            </div>

            {/* Manufacturer */}
            <div className="p-4 bg-background rounded-md">
              <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
                Manufacturer
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {threat.manufacturer || '--'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
