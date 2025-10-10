import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AllInjectsPage } from './pages/AllInjectsPage';
import { NewsPage } from './pages/NewsPage';
import { SocialPage } from './pages/SocialPage';
import { EmailPage } from './pages/EmailPage';
import { SMSPage } from './pages/SMSPage';
import { IntelPage } from './pages/IntelPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <AllInjectsPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'social', element: <SocialPage /> },
      { path: 'email', element: <EmailPage /> },
      { path: 'sms', element: <SMSPage /> },
      { path: 'intel', element: <IntelPage /> },
    ],
  },
]);
