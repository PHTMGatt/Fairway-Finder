// main.tsx
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './pages/Auth/AuthContext';
import Home from './pages/Home/Home';
import Dashboard from './pages/Misc/Dashboard';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import ErrorPage from './pages/Misc/Error';
import CourseFinder from './pages/Courses/CourseFinder';
import MapRouting from './pages/Routing/MapRouting';
import Weather from './pages/Weather/Weather';
import TripResults from './pages/Trips/TripResults';

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
      { path: 'profiles/:profileId', element: <Dashboard /> },
      { path: 'courses', element: <CourseFinder /> },
      { path: 'routing', element: <MapRouting /> },
      { path: 'weather', element: <Weather /> },
      { path: 'trip/:tripId', element: <TripResults /> },
    ],
  },
]);

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
