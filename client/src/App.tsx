// client/src/App.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect } from 'react';
import './App.css';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Auth from './utils/auth';

// (No need to import AuthProvider here, since main.tsx already wraps)
 
// Note; Pull Google Maps API key from environment (handled on server in production)
const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Note; Base GraphQL endpoint (uses relative path in prod, localhost in dev)
const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'include',
});

// Note; Attach JWT token from localStorage to each GraphQL request
const authLink = setContext((_, { headers }) => {
  const token = Auth.getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Note; Instantiate Apollo Client with auth middleware and in-memory cache
const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const names: Record<string, string> = { '/': 'Find your next round', '/me': 'Dashboard', '/courses': 'Course Finder', '/routing': 'Route Planner', '/plan-trip': 'Plan a Trip', '/saved-trips': 'Saved Trips', '/handicap': 'Handicap Tracker', '/weather': 'Weather', '/login': 'Sign in', '/signup': 'Create account' };
    document.title = `${names[pathname] || (pathname.startsWith('/trip/') ? 'Trip Details' : 'Page not found')} | Fairway Finder`;
    window.scrollTo(0, 0);
  }, [pathname]);
  const content = (
      <div className="app-layout">
        {import.meta.env.VITE_PREVIEW_MODE === 'true' && <p role="status" className="preview-notice">Review preview only. Live accounts, saved trips, Maps and data-provider connections are not connected here. Do not enter personal information.</p>}
        <a className="skip-link" href="#main-content">Skip to content</a>
        {/* Note; Persistent header at top */}
        <Header />

        {/* Note; Routed pages render here */}
        <main className="app-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        {/* Note; Persistent footer at bottom */}
        <Footer />
      </div>
  );
  return <ApolloProvider client={apolloClient}>
    {MAP_KEY ? <APIProvider apiKey={MAP_KEY} libraries={['geometry']}>{content}</APIProvider> : content}
  </ApolloProvider>;
};

export default App;
