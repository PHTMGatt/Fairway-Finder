// src/App.tsx

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

// Note; Pull Google Maps API Key from Vite env
const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
console.log('🔑 VITE_GOOGLE_MAPS_API_KEY →', MAP_KEY ? 'Found' : 'Missing');
if (!MAP_KEY) {
  throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY in .env');
}

// Note; Set up base GraphQL endpoint
const httpLink = createHttpLink({
  uri:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});

// Note; Inject JWT token into all request headers
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Note; Create Apollo Client instance with auth and caching
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <APIProvider apiKey={MAP_KEY} libraries={['geometry']}>
        <div className="app-layout">
          {/* Note; Sticky Header */}
          <Header />

          {/* Note; Routed Page Outlet */}
          <main className="app-content">
            <Outlet />
          </main>

          {/* Note; Global Footer */}
          <Footer />
        </div>
      </APIProvider>
    </ApolloProvider>
  );
}

export default App;
