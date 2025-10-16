import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useInjects } from '../contexts/InjectContext';
import { API_HOST } from '../config';

export const Layout = () => {
  // Get team ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team') || 'default-team';

  // Use news-style layout only for public feed teams
  const isPublicFeed = teamId.includes('-public') || teamId === 'public-feed';

  const { injects, timer, connectionStatus, turnInfo } = useInjects();

  // Public Feed Layout - Clean and simple
  if (isPublicFeed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Simple header bar with logos and timer */}
        <div className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-end gap-2">
                <div className="flex flex-col text-xs text-gray-600 leading-tight">
                  <span>Advanced Platform for Exercise &</span>
                  <span>eXperimentation</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">APEX</h1>
                <img src="/api/scenarios/dropbear.png" alt="Dropbear" className="h-8 opacity-70" />
              </div>
              <img src="/cyberops-logo.png" alt="CyberOps" className="h-10" />
              <img src="/dewc-logo.jpeg" alt="DEWC" className="h-8" />
            </div>
            <div className="flex items-center gap-4">
              {turnInfo.turn_based && turnInfo.current_turn && turnInfo.current_turn > 0 && (
                <div className="text-lg font-semibold text-gray-700">
                  Turn {turnInfo.current_turn}{turnInfo.total_turns ? ` of ${turnInfo.total_turns}` : ''}
                </div>
              )}
              <div className="text-3xl font-mono font-bold text-blue-600">{timer}</div>
            </div>
          </div>
        </div>

        {/* Inject cards - white boxes on gradient */}
        <div className="max-w-4xl mx-auto p-6">
          {injects.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Waiting for news updates...</p>
              <div className={`inline-block w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
            </div>
          ) : (
            <div className="space-y-4">
              {injects.map((inject, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-6 border border-gray-200 hover:shadow-blue-500/20 hover:shadow-2xl transition-shadow">
                  {/* Inject content */}
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
                        ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
                        : `T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`
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
                        </div>
                      ) : (
                        <p className="text-base">{inject.content}</p>
                      )
                    ) : null}
                  </div>

                  {/* Media Display - Show main larger image (not breaking news) */}
                  {inject.media && inject.media.length > 0 && (() => {
                    const mainImage = inject.media.find(path => !path.endsWith('_breaking_news.png') && /\.(jpg|jpeg|png|gif)$/i.test(path));
                    if (mainImage) {
                      return (
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
                      );
                    }
                    return null;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular Team Dashboard Layout with gradient background
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
