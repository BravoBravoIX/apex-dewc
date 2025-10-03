import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from "@/components/common/Card.tsx";

interface CurrentExercise {
  active: boolean;
  scenario_name?: string;
  state?: string;
  timer?: {
    formatted: string;
    elapsed: number;
  };
  teams?: Array<{
    id: string;
    delivered: number;
    total: number;
  }>;
}

const DashboardPage = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [currentExercise, setCurrentExercise] = useState<CurrentExercise | null>(null);
  const [scenarioCount, setScenariosCount] = useState(0);
  const [totalInjects, setTotalInjects] = useState(0);

  useEffect(() => {
    // Fetch available scenarios count
    const fetchScenarios = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/scenarios');
        const data = await res.json();
        setScenariosCount(data.scenarios?.length || 0);

        // Calculate total injects across all scenarios
        const injectCount = data.scenarios?.reduce((sum: number, scenario: any) =>
          sum + (scenario.inject_count || 0), 0) || 0;
        setTotalInjects(injectCount);
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      }
    };

    // Fetch current exercise status
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/exercises/current');
        const data = await res.json();
        setActiveCount(data.active ? 1 : 0);
        setCurrentExercise(data.active ? data : null);
      } catch (error) {
        console.error('Failed to fetch exercise status:', error);
      }
    };

    fetchScenarios();
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-6">
          <h3 className="text-3xl font-bold">{scenarioCount}</h3>
          <p className="text-text-secondary">Scenarios Available</p>
        </Card>
        <Card className="text-center p-6">
          <h3 className="text-3xl font-bold">{totalInjects}</h3>
          <p className="text-text-secondary">Total Injects</p>
        </Card>
        <Card className="text-center p-6">
          <h3 className={`text-3xl font-bold ${activeCount > 0 ? 'text-primary' : ''}`}>
            {activeCount}
          </h3>
          <p className="text-text-secondary">Active Exercises</p>
        </Card>
      </div>

      {currentExercise && (
        <div className="mb-6">
          <Card className="p-6 bg-green-900/20 border border-green-500/50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <h3 className="text-lg font-semibold text-green-400">Exercise Running</h3>
                </div>
                <p className="text-text-primary text-lg mb-1">
                  {currentExercise.scenario_name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-text-secondary">
                  Status: <span className={`font-semibold ${
                    currentExercise.state === 'RUNNING' ? 'text-green-500' :
                    currentExercise.state === 'PAUSED' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>{currentExercise.state}</span>
                </p>
                {currentExercise.teams && (
                  <p className="text-sm text-text-secondary mt-1">
                    Teams: {currentExercise.teams.length} |
                    Injects Delivered: {currentExercise.teams.reduce((sum, t) => sum + t.delivered, 0)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-primary mb-2">
                  {currentExercise.timer?.formatted || 'T+00:00'}
                </p>
                <Link
                  to="/control"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
                >
                  Go to Exercise Control
                  <span className="text-xl">→</span>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* About APEX Section */}
        <div className="md:col-span-3">
          <Card className="p-6 h-full">
            <h3 className="text-2xl font-bold mb-4">About APEX</h3>
            <p className="text-text-secondary mb-4">
              APEX (Advanced Platform for Exercise & eXperimentation) is a comprehensive cyber exercise platform
              designed for realistic, multi-team training scenarios. Built for military and defense organizations,
              APEX delivers dynamic, inject-driven exercises that simulate real-world crisis situations.
            </p>
            <p className="text-text-secondary mb-4">
              The platform supports multiple concurrent teams, real-time scenario management, and sophisticated
              inject delivery across various communication channels including news feeds, social media, email, and SMS.
            </p>

            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-lg font-semibold mb-3">Getting Started</h4>
              <ol className="space-y-2 text-text-secondary text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Select a scenario from the <Link to="/scenarios" className="text-primary hover:underline">Scenarios</Link> page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Deploy the exercise to launch team dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Control exercise flow from <Link to="/control" className="text-primary hover:underline">Exercise Control</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <span>Monitor team responses and adjust timing as needed</span>
                </li>
              </ol>
            </div>
          </Card>
        </div>

        {/* Scenario Preview Image */}
        <div className="md:col-span-2 flex items-start">
          <img
            src="/scenarios/dashboard-image.png"
            alt="APEX Exercise Platform"
            className="w-full h-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;