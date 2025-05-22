// main.tsx

import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';

// Note; Import route components for pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Misc/Dashboard';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import ErrorPage from './pages/Misc/Error';
import CourseFinder from './pages/Courses/CourseFinder';
import MapRouting from './pages/Routing/MapRouting';
import Weather from './pages/Weather/Weather';
import TripDetails from './pages/Trips/TripDetails';

// Note; Define application routes with error handling and nested layout
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,              // Note; Main layout (Header, Footer, Outlet)
    errorElement: <ErrorPage />,    // Note; Fallback for any route errors
    children: [
      { index: true, element: <Home /> },                        // Note; Homepage
      { path: 'login', element: <Login /> },                     // Note; Login page
      { path: 'signup', element: <Signup /> },                   // Note; Signup page
      { path: 'me', element: <Dashboard /> },                    // Note; User dashboard
      { path: 'profiles/:profileId', element: <Dashboard /> },   // Note; Profile view (reuses Dashboard)
      { path: 'courses', element: <CourseFinder /> },            // Note; Course search page
      { path: 'routing', element: <MapRouting /> },              // Note; Map routing planner
      { path: 'weather', element: <Weather /> },                 // Note; Weather forecast page
      { path: 'trip/:tripId', element: <TripDetails /> },        // Note; Dynamic trip details page
    ],
  },
]);

// Note; Mount React application into #root element
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <RouterProvider router={router} />
  );
}
