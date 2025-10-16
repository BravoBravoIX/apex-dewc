import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';
import { useMemo } from 'react';

export const SMSPage = () => {
  const { injects } = useInjects();

  const smsInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'sms');
  }, [injects]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">
        SMS Messages ({smsInjects.length})
      </h2>

      {smsInjects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No SMS messages intercepted yet</p>
          <p className="">Waiting for SMS intercepts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {smsInjects.map((inject) => (
            <InjectCard key={inject.id} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
