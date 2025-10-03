import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AllInjectsPage } from './pages/AllInjectsPage';
import { RFControlPage } from './pages/RFControlPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RFControlPage /> },
      { path: 'injects', element: <AllInjectsPage /> },
    ],
  },
]);
