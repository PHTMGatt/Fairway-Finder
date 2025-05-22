import { useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';

import TripList from '../../components/TripList/TripList';
import TripForm from '../../components/TripForm/TripForm';
import Auth from '../../utils/auth';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './Dashboard.css';

const Dashboard = () => {
  // Note; Fetch user trips if logged in
  const { loading, error, data } = useQuery(QUERY_MY_TRIPS);

  // Note; Protect route — redirect if not logged in
  if (!Auth.loggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Note; Extract trips from query result
  const myTrips = data?.me?.trips || [];

  return (
    <main className="dashboard container">
      <h2 className="dashboard__title">My Golf Road Trips</h2>

      {/* Note; Handle query states */}
      {loading ? (
        <p>Loading your trips…</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <TripList trips={myTrips} title="Your Trips" />
      )}

      {/* Note; Trip creation form */}
      <div className="dashboard__form">
        <TripForm />
      </div>
    </main>
  );
};

export default Dashboard;
