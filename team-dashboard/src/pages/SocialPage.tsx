import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';
import { useMemo } from 'react';

export const SocialPage = () => {
  const { injects } = useInjects();

  const socialInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'social');
  }, [injects]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">
        Social Media ({socialInjects.length})
      </h2>

      {socialInjects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No social media injects received yet</p>
          <p className="">Waiting for social media updates...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {socialInjects.map((inject) => (
            <InjectCard key={inject.id} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
