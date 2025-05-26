// client/src/App.tsx

import React from 'react';
import './App.css';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Note; Pull Google Maps API key from environment (handled on server in production)
const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!MAP_KEY) {
  throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY in environment variables');
}

// Note; Base GraphQL endpoint (uses relative path in prod, localhost in dev)
const httpLink = createHttpLink({
  uri:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});

// Note; Attach JWT token from localStorage to each GraphQL request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
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

const App: React.FC = () => (
  <ApolloProvider client={apolloClient}>
    {/* Note; Provides Google Maps JS API to all descendants */}
    <APIProvider apiKey={MAP_KEY} libraries={['geometry']}>
      <div className="app-layout">
        {/* Note; Persistent header at top */}
        <Header />

        {/* Note; Routed pages render here */}
        <main className="app-content">
          <Outlet />
        </main>

        {/* Note; Persistent footer at bottom */}
        <Footer />
      </div>
    </APIProvider>
  </ApolloProvider>
);

export default App;
