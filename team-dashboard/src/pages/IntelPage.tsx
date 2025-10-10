import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';
import { useMemo } from 'react';

export const IntelPage = () => {
  const { injects } = useInjects();

  const intelInjects = useMemo(() => {
    return injects.filter(inject =>
      inject.type?.toLowerCase() === 'intel' ||
      inject.type?.toLowerCase() === 'intelligence'
    );
  }, [injects]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-text-primary">
        Intelligence ({intelInjects.length})
      </h2>

      {intelInjects.length === 0 ? (
        <div className="bg-surface p-8 rounded-lg text-center">
          <p className="text-text-secondary mb-2">No intelligence injects received yet</p>
          <p className="text-xs text-text-muted">Waiting for intelligence updates...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {intelInjects.map((inject) => (
            <InjectCard key={inject.id} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
