import React from 'react';
import { Bell } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="bg-gray-800 text-white h-16 flex items-center justify-between px-6 border-b border-gray-700">
      <div className="flex items-center">
        <h2 className="text-xl">Overview</h2>
      </div>
      <div className="flex items-center space-x-4">
        <Bell className="w-5 h-5" />
        <div className="h-8 w-8 bg-gray-600 rounded-full"></div>
      </div>
    </header>
  );
};

export default TopBar;