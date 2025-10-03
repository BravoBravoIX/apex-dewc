import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const getTitle = (pathname: string) => {
  const name = pathname.split('/').pop() || 'dashboard';
  if (name === '') return 'Dashboard';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const Header = () => {
  const location = useLocation();
  const title = getTitle(location.pathname);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface w-full p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/cyberops-logo.png"
            alt="CyberOps"
            className="h-10 w-auto object-contain"
            style={{ filter: theme === 'dark' ? 'brightness(0.9)' : 'none' }}
          />
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-light hover:bg-primary/10 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-text-secondary" />
            ) : (
              <Sun size={20} className="text-text-secondary" />
            )}
          </button>
          <img
            src="/dewc-logo.jpeg"
            alt="DEWC"
            className="h-8 w-auto object-contain"
            style={{ filter: theme === 'dark' ? 'brightness(0.9)' : 'none' }}
          />
          <div className="text-sm text-text-secondary">User: Admin</div>
        </div>
      </div>
    </header>
  );
};

export default Header;