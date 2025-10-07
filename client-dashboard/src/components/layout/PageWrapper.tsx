
import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return <main className="flex-1 overflow-y-auto p-8">{children}</main>;
};

export default PageWrapper;
