import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';

import TripList from '../components/TripList';
import TripForm from '../components/TripForm';
import Auth from '../utils/auth';
import { QUERY_MY_TRIPS } from '../utils/queries';
import './Dashboard.css';

const Dashboard = () => {
  const { loading, error, data } = useQuery(QUERY_MY_TRIPS);
  
  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const myTrips = data?.me?.trips || [];

  return (
    <main className="dashboard container">
      <h2 className="dashboard__title">My Golf Road Trips</h2>

      {loading ? (
        <p>Loading your trips…</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <TripList trips={myTrips} title="Your Trips" />
      )}

      <div className="dashboard__form">
        <TripForm />
      </div>
    </main>
  );
};

export default Dashboard;
