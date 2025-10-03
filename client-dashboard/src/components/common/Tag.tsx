
import React from 'react';

interface TagProps {
  children: React.ReactNode;
  color?: string;
}

const Tag: React.FC<TagProps> = ({ children, color = 'bg-gray-600' }) => {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${color} text-text-primary`}>
      {children}
    </span>
  );
};

export default Tag;
