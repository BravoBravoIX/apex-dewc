import { Inject } from '../contexts/InjectContext';
import { API_HOST } from '../config';

interface InjectCardProps {
  inject: Inject;
}

export const InjectCard = ({ inject }: InjectCardProps) => {

  const formatTime = (time?: number) => {
    if (time === undefined) return 'Unknown';
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `T+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Find main image (not breaking news)
  const mainImage = inject.media?.find(path => !path.endsWith('_breaking_news.png') && /\.(jpg|jpeg|png|gif)$/i.test(path));

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-6 border border-gray-200 hover:shadow-blue-500/20 hover:shadow-2xl transition-shadow">
      <div className="flex justify-between items-start mb-3">
        {inject.type?.toLowerCase() === 'news' ? (
          <span className="text-base font-bold text-red-600 uppercase">
            BREAKING NEWS
          </span>
        ) : (
          <span className="text-base font-bold text-blue-600 uppercase">
            {inject.type || 'UPDATE'}
          </span>
        )}
        <span className="text-sm text-gray-500 font-mono">
          {inject.delivered_at !== undefined
            ? formatTime(inject.delivered_at)
            : formatTime(inject.time)
          }
        </span>
      </div>

      <div className="text-gray-900">
        {inject.message ? (
          <p className="text-base">{inject.message}</p>
        ) : inject.content ? (
          typeof inject.content === 'object' ? (
            <div>
              {inject.content.headline && (
                <h3 className="text-xl font-bold text-gray-900 mb-2">{inject.content.headline}</h3>
              )}
              {inject.content.body && (
                <p className="text-gray-700 mb-2 leading-relaxed">{inject.content.body}</p>
              )}
              {inject.content.source && (
                <p className="text-sm text-gray-500 italic">Source: {inject.content.source}</p>
              )}
              {inject.content.from && inject.content.to && (
                <div className="text-sm text-gray-600 mt-2">
                  <div>From: {inject.content.from}</div>
                  <div>To: {inject.content.to}</div>
                  {inject.content.subject && <div className="font-medium mt-1">Subject: {inject.content.subject}</div>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-base">{inject.content}</p>
          )
        ) : null}
      </div>

      {/* Media Display - Show main larger image (not breaking news) */}
      {mainImage && (
        <div className="mt-4">
          <img
            src={`${API_HOST}${mainImage}`}
            alt="News media"
            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            onClick={() => window.open(`${API_HOST}${mainImage}`, '_blank')}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};
