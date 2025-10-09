import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';

import DashboardPage from './pages/DashboardPage';
import ScenariosPage from './pages/ScenariosPage';
import ScenarioWorkspacePage from './pages/ScenarioWorkspacePage';
import TimelinesPage from './pages/TimelinesPage';
import TimelineViewerPage from './pages/TimelineViewerPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import MediaTemplatesPage from './pages/MediaTemplatesPage';
import IQLibraryPage from './pages/IQLibraryPage';
import ExerciseControlPage from './pages/ExerciseControlPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <PageWrapper>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/scenarios" element={<ScenariosPage />} />
                <Route path="/scenarios/:scenarioId" element={<ScenarioWorkspacePage />} />
                <Route path="/timelines" element={<TimelinesPage />} />
                <Route path="/timelines/:scenarioId/:teamId" element={<TimelineViewerPage />} />
                <Route path="/media" element={<MediaLibraryPage />} />
                <Route path="/media-templates" element={<MediaTemplatesPage />} />
                <Route path="/iq-library" element={<IQLibraryPage />} />
                <Route path="/control" element={<ExerciseControlPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </PageWrapper>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;