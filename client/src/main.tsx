import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';

// Pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Misc/Dashboard';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import Error from './pages/Misc/Error';
import CourseFinder from './pages/Courses/CourseFinder';
import MapRouting from './pages/Routing/MapRouting';
import Weather from './pages/Weather/Weather';
import TripDetails from './pages/Trips/TripDetails';

// Main router config
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'me', element: <Dashboard /> },
      { path: 'profiles/:profileId', element: <Dashboard /> },
      { path: 'courses', element: <CourseFinder /> },
      { path: 'routing', element: <MapRouting /> },
      { path: 'weather', element: <Weather /> },
      { path: 'trip/:tripId', element: <TripDetails /> }, // ✅ dynamic trip page
    ],
  },
]);

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <RouterProvider router={router} />
  );
}
