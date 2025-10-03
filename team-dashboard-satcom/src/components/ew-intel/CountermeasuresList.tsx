export interface Countermeasure {
  id: string;
  description: string;
  type?: string;
}

interface CountermeasuresListProps {
  countermeasures: Countermeasure[];
}

export const CountermeasuresList = ({ countermeasures }: CountermeasuresListProps) => {
  if (countermeasures.length === 0) {
    return (
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Recommended Countermeasures
            </h2>
          </div>
          <div className="text-center py-4 text-text-secondary">
            No countermeasures available
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Recommended Countermeasures
          </h2>
        </div>

        <div className="space-y-3">
          {countermeasures.map((countermeasure) => (
            <div
              key={countermeasure.id}
              className="p-4 bg-primary/10 border-l-4 border-primary rounded text-sm"
            >
              {countermeasure.type && (
                <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
                  {countermeasure.type}
                </div>
              )}
              <div className="text-text-primary leading-relaxed">
                {countermeasure.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
