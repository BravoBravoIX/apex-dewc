import { NavLink } from 'react-router-dom';
import { useInjects } from '../contexts/InjectContext';
import { useMemo } from 'react';

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
    <div className="w-64 bg-sidebar-bg h-screen p-4 flex flex-col border-r border-sidebar-surface">
      <div className="mb-8">
        <div className="text-2xl font-bold text-sidebar-text">APEX</div>
        <div className="text-xs text-sidebar-text-muted mt-1 mb-3">Advanced Platform for Exercise & eXperimentation</div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sidebar-text-muted">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'reconnecting' ? 'Reconnecting...' :
             'Disconnected'}
          </span>
        </div>
      </div>

      <nav className="flex flex-col space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.name === 'All Injects'}
            className={({ isActive }) =>
              `px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ` +
              (isActive
                ? 'bg-sidebar-accent text-sidebar-bg'
                : 'text-sidebar-text-muted hover:bg-sidebar-surface hover:text-sidebar-text')
            }
          >
            {({ isActive }) => (
              <>
                <span>{item.name}</span>
                {item.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-sidebar-bg text-sidebar-accent' : 'bg-sidebar-surface text-sidebar-text-muted'
                  }`}>
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
