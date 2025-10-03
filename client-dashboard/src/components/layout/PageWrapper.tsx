
import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return <main className="p-8 w-full">{children}</main>;
};

export default PageWrapper;
