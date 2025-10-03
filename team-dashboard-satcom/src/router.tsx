import { createBrowserRouter } from 'react-router-dom';
import { SpaceOpsPage } from './pages/SpaceOpsPage';
import { EWIntelPage } from './pages/EWIntelPage';

// TeamRouter component that routes based on team param
const TeamRouter = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team');

  switch (teamId) {
    case 'spaceops':
      return <SpaceOpsPage />;
    case 'ew-intel':
      return <EWIntelPage />;
    default:
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-error mb-2">Invalid Team</h1>
            <p className="text-text-secondary">
              Team parameter must be 'spaceops' or 'ew-intel'
            </p>
            <p className="text-text-muted text-sm mt-4">
              Current team: {teamId || 'not specified'}
            </p>
          </div>
        </div>
      );
  }
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <TeamRouter />,
  },
]);
