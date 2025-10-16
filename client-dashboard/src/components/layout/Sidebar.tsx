
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Scenarios', href: '/scenarios' },
  { name: 'Media Library', href: '/media' },
  { name: 'Media Templates', href: '/media-templates' },
  { name: 'IQ Library', href: '/iq-library' },
  { name: 'Exercise Control', href: '/control' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
];

const Sidebar = () => {
  const { theme } = useTheme();
  // Demo mode toggle - set to false to enable all menu items
  const DEMO_MODE = true;
  const disabledItems = ['Analytics', 'Settings'];

  // Gradient theme uses card-style sidebar like team-dashboard
  if (theme === 'gradient') {
    return (
      <div className="w-64 h-screen p-4 flex flex-col">
        <div className="bg-gray-200 rounded-lg p-4 shadow-md mb-4 flex flex-col flex-1">
          <div className="mb-4">
            <div className="text-xl font-bold text-gray-900">Navigation</div>
          </div>

          <nav className="flex flex-col divide-y divide-gray-300 flex-1">
            {navigation.map((item) => {
              const isDisabled = DEMO_MODE && disabledItems.includes(item.name);

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="px-4 py-3 text-sm font-medium text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    {item.name}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    `px-4 py-3 text-sm font-medium transition-colors ` +
                    (isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-300')
                  }
                >
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 flex justify-center border-t border-gray-300">
            <img
              src="/api/scenarios/dropbear.png"
              alt="APEX Logo"
              className="h-20 w-auto opacity-70"
            />
          </div>
        </div>
      </div>
    );
  }

  // Light and Dark theme sidebar
  return (
    <div className="w-64 bg-sidebar-bg h-screen p-4 flex flex-col border-r border-sidebar-surface">
      <div className="mb-10">
        <div className="text-2xl font-bold text-sidebar-text">APEX</div>
        <div className="text-xs text-sidebar-text-muted mt-1">Advanced Platform for Exercise & eXperimentation</div>
      </div>
      <nav className="flex flex-col space-y-2 flex-1">
        {navigation.map((item) => {
          const isDisabled = DEMO_MODE && disabledItems.includes(item.name);

          if (isDisabled) {
            return (
              <div
                key={item.name}
                className="px-4 py-2 rounded-md text-sm font-medium text-sidebar-text-muted opacity-50 cursor-not-allowed"
              >
                {item.name}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-md text-sm font-medium transition-colors ` +
                (isActive
                  ? 'bg-sidebar-accent text-sidebar-bg'
                  : 'text-sidebar-text-muted hover:bg-sidebar-surface hover:text-sidebar-text')
              }
            >
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 flex justify-center border-t border-sidebar-surface">
        <img
          src="/api/scenarios/dropbear.png"
          alt="APEX Logo"
          className="h-20 w-auto opacity-70"
        />
      </div>
    </div>
  );
};

export default Sidebar;
