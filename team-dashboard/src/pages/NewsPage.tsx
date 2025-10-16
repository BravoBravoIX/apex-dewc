import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';
import { useMemo } from 'react';

export const NewsPage = () => {
  const { injects } = useInjects();

  const newsInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'news');
  }, [injects]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">
        News ({newsInjects.length})
      </h2>

      {newsInjects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No news injects received yet</p>
          <p className="">Waiting for news updates...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsInjects.map((inject) => (
            <InjectCard key={inject.id} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
