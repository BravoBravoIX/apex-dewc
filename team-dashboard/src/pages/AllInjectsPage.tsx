import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';

export const AllInjectsPage = () => {
  const { injects } = useInjects();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">
        All Injects ({injects.length})
      </h2>

      {injects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">Waiting for injects...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {injects.map((inject) => (
            <InjectCard key={inject.id} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
