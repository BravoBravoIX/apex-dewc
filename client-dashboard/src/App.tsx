import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';

import DashboardPage from './pages/DashboardPage';
import ScenariosPage from './pages/ScenariosPage';
import ScenarioWorkspacePage from './pages/ScenarioWorkspacePage';
import LiveInjectsPage from './pages/LiveInjectsPage';
import TimelinesPage from './pages/TimelinesPage';
import TimelineViewerPage from './pages/TimelineViewerPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import MediaTemplatesPage from './pages/MediaTemplatesPage';
import IQLibraryPage from './pages/IQLibraryPage';
import ExerciseControlPage from './pages/ExerciseControlPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { isAuthenticated, requiresAuth } = useAuth();
  const { theme } = useTheme();

  // If authentication is required and user is not authenticated, show login page
  if (requiresAuth && !isAuthenticated) {
    return <LoginPage />;
  }

  // Gradient theme layout - header full width at top, then sidebar + content
  if (theme === 'gradient') {
    return (
      <Router>
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <PageWrapper>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/scenarios" element={<ScenariosPage />} />
                <Route path="/scenarios/:scenarioId" element={<ScenarioWorkspacePage />} />
                <Route path="/scenarios/:scenarioId/live-injects" element={<LiveInjectsPage />} />
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
    );
  }

  // Light and dark theme layout - sidebar on left, header and content on right
  return (
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
              <Route path="/scenarios/:scenarioId/live-injects" element={<LiveInjectsPage />} />
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
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;