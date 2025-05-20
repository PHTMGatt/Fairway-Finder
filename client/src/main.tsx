import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import Home from './pages/Home';
import Profile from './pages/Dashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Error from './pages/Error';
import CourseFinder from './pages/CourseFinder';
import MapRouting from './pages/MapRouting';
import Weather from './pages/Weather';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/profiles/:profileId', element: <Profile /> },
      { path: '/me', element: <Profile /> },
      { path: '/courses', element: <CourseFinder /> },   // ← added
      { path: '/routing', element: <MapRouting /> },    // ← added
      { path: '/weather', element: <Weather /> },       // ← added
    ],
  },
]);

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <RouterProvider router={router} />
  );
}
