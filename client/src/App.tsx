// client/src/App.tsx

import React, { useMemo } from 'react';
import './App.css';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  from,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { Outlet, useNavigate } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Auth from './utils/auth';
import { hasGoogleMapsKey } from './utils/mapCapability';
import { useAuth } from './pages/Auth/AuthContext';

const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';

const httpLink = createHttpLink({
  uri:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = Auth.getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const App: React.FC = () => {
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const apolloClient = useMemo(() => {
    let client: ApolloClient<NormalizedCacheObject>;
    let handlingAuthError = false;

    const errorLink = onError(({ graphQLErrors }) => {
      const unauthenticated = graphQLErrors?.some(
        (graphQLError) => graphQLError.extensions?.code === 'UNAUTHENTICATED'
      );

      if (!unauthenticated || handlingAuthError) return;
      handlingAuthError = true;

      const token = Auth.getToken();
      const reason = token ? Auth.getExpiredReasonFromToken(token) : 'expired';
      logoutUser();

      void client.clearStore().finally(() => {
        navigate(`/login?reason=${reason}`, { replace: true });
      });
    });

    client = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache(),
    });

    return client;
  }, [logoutUser, navigate]);

  const layout = (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );

  return (
    <ApolloProvider client={apolloClient}>
      {hasGoogleMapsKey(MAP_KEY) ? (
        <APIProvider apiKey={MAP_KEY} libraries={['geometry']}>
          {layout}
        </APIProvider>
      ) : (
        layout
      )}
    </ApolloProvider>
  );
};

export default App;
