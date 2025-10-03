import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, ChevronRight } from 'lucide-react';

interface Timeline {
  scenarioId: string;
  scenarioName: string;
  teamId: string;
  teamName: string;
  timelineFile: string;
  injectCount?: number;
}

const TimelinesPage: React.FC = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelines();
  }, []);

  const fetchTimelines = async () => {
    try {
      // Fetch all scenarios to get timeline information
      const response = await fetch(`${API_BASE_URL}/api/v1/scenarios`);
      const data = await response.json();

      const allTimelines: Timeline[] = [];

      // Extract timeline info from each scenario
      for (const scenario of data.scenarios) {
        // Fetch full scenario details
        const scenarioResponse = await fetch(`${API_BASE_URL}/api/v1/scenarios/${scenario.id}`);
        const scenarioData = await scenarioResponse.json();

        // Add timeline for each team
        scenarioData.teams?.forEach((team: any) => {
          if (team.timeline_file) {
            allTimelines.push({
              scenarioId: scenario.id,
              scenarioName: scenario.name,
              teamId: team.id,
              teamName: team.name,
              timelineFile: team.timeline_file
            });
          }
        });
      }

      setTimelines(allTimelines);
    } catch (error) {
      console.error('Failed to fetch timelines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading timelines...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Inject Timelines</h1>
        <p className="text-text-secondary">View and edit inject timelines for each team in your scenarios</p>
      </div>

      {timelines.length === 0 ? (
        <div className="bg-surface rounded-lg card p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <p className="text-text-secondary">No timelines found. Create a scenario with teams to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {timelines.map((timeline, index) => (
            <Link
              key={index}
              to={`/timelines/${timeline.scenarioId}/${timeline.teamId}`}
              className="bg-surface rounded-lg card hover:shadow-lg transition-shadow p-6 block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {timeline.teamName}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Scenario: {timeline.scenarioName}
                    </p>
                    <p className="text-xs text-text-muted mt-1 font-mono">
                      {timeline.timelineFile}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-text-muted">
                  <span className="text-sm">View & Edit</span>
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-surface rounded-lg card">
        <h3 className="font-semibold text-text-primary mb-2">Timeline Management</h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>Click on any timeline to view and edit inject timing</li>
          <li>Changes are saved to the scenario configuration files</li>
          <li>Timeline edits take effect on the next exercise deployment</li>
        </ul>
      </div>
    </div>
  );
};

export default TimelinesPage;