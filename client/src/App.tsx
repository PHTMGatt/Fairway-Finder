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

import Header from './components/Header';
import Footer from './components/Footer';

const httpLink = createHttpLink({
  // in dev, point directly at your Express/GraphQL server
  uri:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001/graphql'
      : '/graphql',
  credentials: 'include',
});

// attach JWT token to every request
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
      <div className="app-layout">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ApolloProvider>
  );
}

export default App;
