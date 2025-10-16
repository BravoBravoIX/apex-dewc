import { NavLink } from 'react-router-dom';
import { useInjects } from '../contexts/InjectContext';
import { useMemo } from 'react';
import { API_HOST } from '../config';

export const Sidebar = () => {
  const { injects, connectionStatus } = useInjects();
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';

  const counts = useMemo(() => {
    const typeCounts = {
      news: 0,
      social: 0,
      email: 0,
      sms: 0,
      intel: 0,
    };

    injects.forEach(inject => {
      const type = inject.type?.toLowerCase();
      if (type === 'intel' || type === 'intelligence') {
        typeCounts.intel++;
      } else if (type && type in typeCounts) {
        typeCounts[type as keyof typeof typeCounts]++;
      }
    });

    return typeCounts;
  }, [injects]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-success';
      case 'connecting': return 'bg-warning';
      case 'reconnecting': return 'bg-warning';
      case 'disconnected': return 'bg-error';
      default: return 'bg-text-muted';
    }
  };

  const navigation = [
    { name: 'All Injects', href: `/${queryString}`, count: injects.length },
    { name: 'News', href: `/news${queryString}`, count: counts.news },
    { name: 'Social', href: `/social${queryString}`, count: counts.social },
    { name: 'Email', href: `/email${queryString}`, count: counts.email },
    { name: 'SMS', href: `/sms${queryString}`, count: counts.sms },
    { name: 'Intel', href: `/intel${queryString}`, count: counts.intel },
  ];

  return (
    <div className="w-64 h-full p-4 flex flex-col">
      <div className="bg-gray-200 rounded-lg p-4 shadow-md mb-4">
        <div className="mb-4">
          <div className="text-xl font-bold text-gray-900">Navigation</div>
          <div className="flex items-center gap-2 text-xs mt-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'reconnecting' ? 'Reconnecting...' :
               'Disconnected'}
            </span>
          </div>
        </div>

        <nav className="flex flex-col divide-y divide-gray-300">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.name === 'All Injects'}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ` +
                (isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-300')
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.name}</span>
                  {item.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 pt-4 flex justify-center border-t border-gray-300">
          <img
            src={`${API_HOST}/api/scenarios/dropbear.png`}
            alt="Dropbear"
            className="h-20 w-auto opacity-70"
          />
        </div>
      </div>
    </div>
  );
};
