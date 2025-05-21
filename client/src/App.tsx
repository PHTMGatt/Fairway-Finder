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

// ——— Apollo HTTP Link ———
const httpLink = createHttpLink({
  uri:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});

// ——— Auth Middleware ———
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// ——— Apollo Client ———
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// ——— Main App Layout ———
function App() {
  return (
    <ApolloProvider client={client}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
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
