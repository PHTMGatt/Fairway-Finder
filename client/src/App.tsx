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

const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
console.log('🔑 VITE_GOOGLE_MAPS_API_KEY →', MAP_KEY);
if (!MAP_KEY) {
  throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY in .env');
}

const httpLink = createHttpLink({
  uri:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <APIProvider apiKey={MAP_KEY} libraries={['geometry']}>
        <div className="app-layout">
          <Header />
          <main className="app-content">
            <Outlet />
          </main>
          <Footer />
        </div>
      </APIProvider>
    </ApolloProvider>
  );
}

export default App;
