import React, { useState } from 'react';
import { Play, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import AssetList from './AssetList';

const ScenarioLaunch = ({ scenario }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const [error, setError] = useState(null);

  const handleLaunch = async () => {
    if (!window.confirm('This will activate the scenario. Only one scenario can be active at a time. Continue?')) {
      return;
    }

    setError(null);
    setIsLaunching(true);

    try {
      // First check if there's already an active scenario
      const checkActive = await fetch('/api/scenarios/active');
      const activeData = await checkActive.json();
      
      if (activeData.active) {
        throw new Error('Another scenario is currently active. Please deactivate it first.');
      }

      // Proceed with activation
      const response = await fetch(`/api/scenarios/${scenario.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to activate scenario');
      }

      const data = await response.json();
      setIsLaunched(true);
      console.log('Scenario activated:', data);
    } catch (err) {
      setError(err.message || 'Failed to launch scenario. Please try again.');
      console.error('Launch error:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  if (!scenario) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 w-full space-y-4">
        <div className="text-gray-400 text-center py-4">
          Please select a scenario to launch
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Launch Scenario</h2>
        {isLaunched && (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Launched</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Scenario Info */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Scenario</div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-100 font-medium">{scenario.name}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`px-2 py-1 rounded-full text-xs ${
              scenario.type === 'satellite_operations'
                ? 'bg-blue-500/10 text-blue-400'
                : scenario.type === 'training'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {scenario.type.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Required Assets */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Required Assets</div>
          <AssetList assets={scenario.assets} />
        </div>

        {/* Launch Button */}
        <div className="flex justify-center">
          <button
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center justify-center space-x-2 transition-colors ${
              isLaunching || isLaunched ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleLaunch}
            disabled={isLaunching || isLaunched}
          >
            <Play className="w-5 h-5" />
            <span>
              {isLaunching ? 'Launching...' : isLaunched ? 'Launched' : 'Launch Scenario'}
            </span>
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioLaunch;