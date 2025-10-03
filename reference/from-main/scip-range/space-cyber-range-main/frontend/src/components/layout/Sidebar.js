import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Box, Radio, Users, Settings, Database, Shield, Bell, Files, LayoutGrid } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: Globe, label: 'Overview', path: '/' },
    { icon: LayoutGrid, label: 'Scenario Management', path: '/scenariomanagement' },
    { icon: Box, label: 'Scenario Operations', path: '/scenariooperations' },
    { icon: Radio, label: 'RF Simulation', path: '/rf-simulation' },
    { icon: LayoutGrid, label: 'Templates', path: '/templates' }
  ];

  return (
    <div className="w-64 bg-gray-800 text-gray-100">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Space Cyber Range</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
