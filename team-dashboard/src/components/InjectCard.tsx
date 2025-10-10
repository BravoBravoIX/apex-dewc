import { useState } from 'react';
import { Inject } from '../contexts/InjectContext';
import { API_HOST } from '../config';

interface InjectCardProps {
  inject: Inject;
}

export const InjectCard = ({ inject }: InjectCardProps) => {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const formatTime = (time?: number) => {
    if (time === undefined) return 'Unknown';
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `T+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if this is a news inject with breaking news PNG
  const hasBreakingNewsPNG = inject.type === 'news' &&
    inject.media?.some(m => m.endsWith('_breaking_news.png'));

  const breakingNewsImage = hasBreakingNewsPNG && !imageLoadFailed
    ? inject.media?.find(m => m.endsWith('_breaking_news.png'))
    : null;

  return (
    <div className="bg-background p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-sm font-semibold text-primary">
              {inject.type?.toUpperCase() || 'INJECT'}
            </span>
            <span className="text-xs text-text-muted ml-2">
              ID: {inject.id}
            </span>
          </div>
        </div>
        <span className="text-xs text-text-secondary font-mono">
          {inject.delivered_at !== undefined
            ? formatTime(inject.delivered_at)
            : `Scheduled: ${formatTime(inject.time)}`
          }
        </span>
      </div>

      {/* Only show text content if NOT a breaking news PNG */}
      {!breakingNewsImage && (
        <div className="text-text-primary mt-2">
          {inject.message ? (
            inject.message
          ) : inject.content ? (
            typeof inject.content === 'object' ? (
              <div>
                {inject.content.headline && (
                  <div className="font-semibold mb-1">{inject.content.headline}</div>
                )}
                {inject.content.body && (
                  <div className="mb-1">{inject.content.body}</div>
                )}
                {inject.content.source && (
                  <div className="text-sm text-text-secondary italic">Source: {inject.content.source}</div>
                )}
                {inject.content.from && inject.content.to && (
                  <div className="text-sm text-text-secondary mt-2">
                    <div>From: {inject.content.from}</div>
                    <div>To: {inject.content.to}</div>
                    {inject.content.subject && <div className="font-medium mt-1">Subject: {inject.content.subject}</div>}
                  </div>
                )}
              </div>
            ) : (
              inject.content
            )
          ) : (
            <div className="text-sm font-mono bg-surface-light p-2 rounded">
              {JSON.stringify(inject.data || inject, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Media rendering */}
      {breakingNewsImage ? (
        // Show ONLY breaking news PNG with error fallback
        <div className="mt-3">
          <img
            src={`${API_HOST}${breakingNewsImage}`}
            alt="Breaking news"
            className="rounded cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxWidth: '1000px', maxHeight: '750px', objectFit: 'contain' }}
            onClick={() => window.open(`${API_HOST}${breakingNewsImage}`, '_blank')}
            onError={() => {
              // Fallback to text display if breaking news PNG fails
              setImageLoadFailed(true);
            }}
          />
        </div>
      ) : inject.media && inject.media.length > 0 ? (
        // Show all images (old behavior)
        <div className="mt-3 flex flex-wrap gap-2">
          {inject.media.map((mediaPath, idx) => {
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaPath);
            if (isImage) {
              return (
                <img
                  key={idx}
                  src={`${API_HOST}${mediaPath}`}
                  alt="Inject media"
                  className="rounded cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxWidth: '1000px', maxHeight: '750px', objectFit: 'contain' }}
                  onClick={() => window.open(`${API_HOST}${mediaPath}`, '_blank')}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJhMmEyYSIgc3Ryb2tlPSIjNDQ0IiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPkltYWdlIFVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                    target.style.cursor = 'default';
                    target.onclick = null;
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      ) : null}
    </div>
  );
};
