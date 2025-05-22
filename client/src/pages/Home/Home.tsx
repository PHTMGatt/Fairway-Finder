import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';

import TripList from '../../components/TripList/TripList';
import GoogleMapView from '../../components/GoogleMap/GoogleMapView';
import { QUERY_TRIPS } from '../../utils/queries';
import Auth from '../../utils/auth';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const loggedIn = Auth.loggedIn();
  const { loading, data, error } = useQuery(QUERY_TRIPS, {
    skip: !loggedIn,
  });

  const trips = data?.trips || [];

  return (
    <main className="home">
      {/* Note; Hero Section */}
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button className="btn btn--light home__btn" onClick={() => navigate('/routing')}>
            Plan a Trip
          </button>
          <button className="btn btn--light home__btn" onClick={() => navigate('/me')}>
            View Saved Trips
          </button>
        </div>
      </section>

      {/* Note; Search Form */}
      <section className="home__search">
        <input className="home__input" type="text" placeholder="Start Location" />
        <input className="home__input" type="text" placeholder="End Location" />
        <input className="home__input" type="text" placeholder="Max Distance" />
        <button className="btn home__find-btn">Find Courses</button>
      </section>

      {/* Note; Map Section */}
      <section className="home__map">
        <GoogleMapView />
      </section>

      {/* Note; Saved Trips Section */}
      {loggedIn && (
        <section className="home__saved-trips container">
          {loading ? (
            <p>Loading trips…</p>
          ) : error ? (
            <p>Error: {error.message}</p>
          ) : (
            <TripList trips={trips} title="Saved Trips" />
          )}
        </section>
      )}

      {/* Note; Bottom Navigation */}
      <nav className="home__bottom-nav">
        <button className="home__nav-item btn--circle" onClick={() => navigate('/routing')}>
          <FaMapMarkedAlt size={20} />
          <span>Map Routing</span>
        </button>
        <button className="home__nav-item btn--circle" onClick={() => navigate('/courses')}>
          <FaFlag size={20} />
          <span>Course Finder</span>
        </button>
        <button className="home__nav-item btn--circle" onClick={() => navigate('/weather')}>
          <FaCloudSun size={20} />
          <span>Weather</span>
        </button>
      </nav>
    </main>
  );
};

export default Home;
