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
      <h2 className="text-2xl font-bold text-white">
        Intelligence ({intelInjects.length})
      </h2>

      {intelInjects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No intelligence injects received yet</p>
          <p className="">Waiting for intelligence updates...</p>
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
