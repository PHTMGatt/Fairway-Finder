// client/src/main.tsx

import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './pages/Auth/AuthContext';

import App from './App';
import Home from './pages/Home/Home';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import ErrorPage from './pages/Error/Error';
import 'bootstrap/dist/css/bootstrap.min.css';

const CourseFinder = lazy(() => import('./pages/Courses/CourseFinder'));
const MapRouting = lazy(() => import('./pages/Routes/MapRouting'));
const PlanTrip = lazy(() => import('./pages/Trips/PlanTrip'));
const SavedTrips = lazy(() => import('./pages/Trips/SavedTrips'));
const TripDetails = lazy(() => import('./pages/Trips/TripDetails'));
const Weather = lazy(() => import('./pages/Weather/Weather'));
const Handicap = lazy(() => import('./pages/Handicap/HandicapTracker'));

const deferred = (element: React.ReactNode) => (
  <Suspense fallback={<p className="app-route-loading">Loading…</p>}>
    {element}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'me', element: <Navigate to="/saved-trips" replace /> },
      { path: 'saved-trips', element: deferred(<SavedTrips />) },
      { path: 'plan-trip', element: deferred(<PlanTrip />) },
      { path: 'courses', element: deferred(<CourseFinder />) },
      { path: 'routing', element: deferred(<MapRouting />) },
      { path: 'weather', element: deferred(<Weather />) },
      { path: 'trip/:tripId', element: deferred(<TripDetails />) },
      { path: 'handicap', element: deferred(<Handicap />) },
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
