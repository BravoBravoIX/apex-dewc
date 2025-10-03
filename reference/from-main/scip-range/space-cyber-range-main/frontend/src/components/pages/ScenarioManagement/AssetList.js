import React from 'react';
import { Satellite, Server, Radio, Shield } from 'lucide-react';

const AssetList = ({ assets }) => {
  if (!assets || assets.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No assets required for this scenario
      </div>
    );
  }

  // Map asset types to their icons and styling
  const assetConfig = {
    satellite: {
      icon: Satellite,
      color: 'text-blue-400'
    },
    ground_station: {
      icon: Server,
      color: 'text-green-400'
    },
    rf_simulator: {
      icon: Radio,
      color: 'text-purple-400'
    },
    attacker_vm: {
      icon: Shield,
      color: 'text-red-400'
    }
  };

  // Helper to format asset type display name
  const formatAssetType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {assets.map((asset, index) => {
        const config = assetConfig[asset.type] || {
          icon: Server,
          color: 'text-gray-400'
        };

        return (
          <div 
            key={`${asset.type}-${index}`}
            className="bg-gray-700 rounded-lg p-3 flex items-center space-x-3"
          >
            {React.createElement(config.icon, {
              className: `w-6 h-6 ${config.color}`
            })}
            <div>
              <div className="text-gray-100 font-medium">
                {formatAssetType(asset.type)}
              </div>
              <div className="text-sm text-gray-400">
                Count: {asset.count || 1}
              </div>
              {asset.requirements && (
                <div className="text-xs text-gray-400 mt-1">
                  {asset.requirements.cpu_cores && `CPU: ${asset.requirements.cpu_cores} cores`}
                  {asset.requirements.memory_gb && `, RAM: ${asset.requirements.memory_gb}GB`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssetList;
