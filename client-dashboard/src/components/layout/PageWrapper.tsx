
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const { theme } = useTheme();

  // Gradient theme uses container card to unify content
  if (theme === 'gradient') {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-gray-200/80 backdrop-blur-sm rounded-lg shadow-xl p-6">
          {children}
        </div>
      </main>
    );
  }

  // Light and dark themes use original styling
  return <main className="flex-1 overflow-y-auto p-8">{children}</main>;
};

export default PageWrapper;
