import React, { useState, useEffect } from 'react';
import ScenarioCard from './ScenarioCard';
import { AlertCircle } from 'lucide-react';

const ScenarioCatalog = ({ onScenarioSelect }) => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('/api/scenarios');
        if (!response.ok) {
          throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
        }
        const data = await response.json();
        setScenarios(data.scenarios || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching scenarios:', err);
        setError('Failed to load scenarios. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();

    // Refresh scenarios every 30 seconds
    const intervalId = setInterval(fetchScenarios, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 w-1/3">
        <h2 className="text-xl font-semibold text-gray-100">Scenario Catalog</h2>
        <div className="text-gray-400 text-center py-4">
          Loading scenarios...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 w-1/3">
        <h2 className="text-xl font-semibold text-gray-100">Scenario Catalog</h2>
        <div className="flex items-center justify-center gap-2 text-red-400 py-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 w-1/3">
        <h2 className="text-xl font-semibold text-gray-100">Scenario Catalog</h2>
        <div className="text-gray-400 text-center py-4">
          No scenarios available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-1/3 space-y-4">
      <h2 className="text-xl font-semibold text-gray-100">Scenario Catalog</h2>
      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={onScenarioSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ScenarioCatalog;
