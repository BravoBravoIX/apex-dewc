// Overview/index.js
import React from 'react';
import TotalScenarios from './TotalScenarios';
import ActiveInstancesPanel from './ActiveInstancesPanel';
import ServicesHealth from './ServicesHealth';
import NetworkStatus from './NetworkStatus';
import ResourceUsage from './ResourceUsage';

const Overview = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Range Overview</h1>
      
      {/* Top row - Key Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <TotalScenarios />
        <ActiveInstancesPanel />
      </div>

      {/* Middle row - Health and Network */}
      <div className="grid grid-cols-2 gap-6">
        <ServicesHealth />
        <NetworkStatus />
      </div>

      {/* Bottom row - Full width resource usage */}
      <ResourceUsage />
    </div>
  );
};

export default Overview;

// Required component files (to be created):
/*
Overview/
  ├── index.js
  ├── TotalScenarios.js       - Counter with available/total scenarios
  ├── ActiveInstancesPanel.js - List of currently running instances
  ├── ServicesHealth.js       - Health status of core services with uptime
  ├── NetworkStatus.js        - Network metrics and latency display
  └── ResourceUsage.js        - CPU/Memory/Storage graphs
*/

// Sample data structure for components:
const sampleData = {
  scenarios: {
    total: 8,
    available: 5,
    active: 3
  },
  instances: [
    { id: 'inst-1', name: 'RF Training 1', status: 'running', teams: 2 },
    { id: 'inst-2', name: 'Satellite Ops', status: 'starting', teams: 1 }
  ],
  services: [
    { name: 'API', status: 'healthy', uptime: '5d 12h' },
    { name: 'Database', status: 'healthy', uptime: '5d 12h' },
    { name: 'File System', status: 'healthy', uptime: '5d 12h' }
  ],
  network: {
    status: 'operational',
    latency: 15,
    bandwidth: 850,
    connections: 24
  },
  resources: {
    cpu: { used: 45, total: 100 },
    memory: { used: 12288, total: 16384 },
    storage: { used: 256, total: 1024 }
  }
}
