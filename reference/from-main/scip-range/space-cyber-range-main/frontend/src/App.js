import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your store from wherever you keep it:
import { store } from './store';

// Layouts and pages
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './components/auth/LoginPage';
import Overview from './components/pages/Overview';
import ScenarioManagement from './components/pages/ScenarioManagement';
import ScenarioOperations from './components/pages/ScenarioOperations';
import RFSimulation from './components/pages/RFSimulation';
import Templates from './components/pages/Templates';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (username, password) => {
    if (username === 'cyberops' && password === 'cyberops') {
      setIsAuthenticated(true);
    }
  };

  // If not authenticated, show the login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // If authenticated, wrap everything with <Provider> so Redux is available
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="scenariomanagement" element={<ScenarioManagement />} />
            <Route path="scenariooperations" element={<ScenarioOperations />} />
            <Route path="rf-simulation" element={<RFSimulation />} />
            <Route path="templates" element={<Templates />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
