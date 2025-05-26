// client/src/main.tsx

import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './pages/Auth/AuthContext';

import App from './App';
import Home from './pages/Home/Home';
import Dashboard from './pages/DashBoard/DashBoard';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import ErrorPage from './pages/Error/Error';
import CourseFinder from './pages/Courses/CourseFinder';
import MapRouting from './pages/Routes/MapRouting';
import PlanTrip from './pages/Trips/PlanTrip';
import SavedTrips from './pages/Trips/SavedTrips';
import TripDetails from './pages/Trips/TripDetails';
import Weather from './pages/Weather/Weather';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'me', element: <Dashboard /> },
      { path: 'saved-trips', element: <SavedTrips /> },
      { path: 'plan-trip', element: <PlanTrip /> },
      { path: 'courses', element: <CourseFinder /> },
      { path: 'routing', element: <MapRouting /> },
      { path: 'weather', element: <Weather /> },
      { path: 'trip/:tripId', element: <TripDetails /> },
    ],
  },
]);

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
