import { useInjects } from '../contexts/InjectContext';
import { useMemo, useState } from 'react';
import { Inject } from '../contexts/InjectContext';
import { API_HOST } from '../config';

export const EmailPage = () => {
  const { injects } = useInjects();
  const [selectedEmail, setSelectedEmail] = useState<Inject | null>(null);

  const emailInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'email');
  }, [injects]);

  const getEmailContent = (inject: Inject) => {
    if (typeof inject.content === 'object' && inject.content) {
      return {
        from: inject.content.from || 'Unknown',
        to: inject.content.to || 'Unknown',
        subject: inject.content.subject || '(No Subject)',
        body: inject.content.body || inject.message || '(No content)',
      };
    }
    return {
      from: 'Unknown',
      to: 'Unknown',
      subject: '(No Subject)',
      body: inject.message || inject.content || '(No content)',
    };
  };

  const formatTime = (time?: number) => {
    if (time === undefined) return 'Unknown';
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `T+${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">
        Email ({emailInjects.length})
      </h2>

      {emailInjects.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No emails received yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Inbox List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Inbox</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {emailInjects.map((inject) => {
                const email = getEmailContent(inject);
                const isSelected = selectedEmail?.id === inject.id;

                return (
                  <div
                    key={inject.id}
                    onClick={() => setSelectedEmail(inject)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {email.from}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTime(inject.delivered_at || inject.time)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium mb-1">
                      {email.subject}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {typeof email.body === 'string' ? email.body : JSON.stringify(email.body)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Detail */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200">
            {selectedEmail ? (
              <div className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {getEmailContent(selectedEmail).subject}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-gray-500 font-medium w-16">From:</span>
                      <span className="text-gray-900">{getEmailContent(selectedEmail).from}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 font-medium w-16">To:</span>
                      <span className="text-gray-900">{getEmailContent(selectedEmail).to}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 font-medium w-16">Time:</span>
                      <span className="text-gray-600 font-mono">
                        {formatTime(selectedEmail.delivered_at || selectedEmail.time)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-gray-900 whitespace-pre-wrap">
                  {getEmailContent(selectedEmail).body}
                </div>

                {selectedEmail.media && selectedEmail.media.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.media.map((mediaPath, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaPath);
                        if (isImage) {
                          return (
                            <img
                              key={idx}
                              src={`${API_HOST}${mediaPath}`}
                              alt="Email attachment"
                              className="rounded cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }}
                              onClick={() => window.open(`${API_HOST}${mediaPath}`, '_blank')}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-600">
                Select an email to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
