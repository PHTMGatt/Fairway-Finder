// client/src/pages/Home/Home.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';
import { useQuery } from '@apollo/client';
import { QUERY_TRIPS } from '../../utils/queries';
import TripList from '../../components/TripList/TripList';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import Auth from '../../utils/auth';
import './Home.css';

const Home: React.FC = () => {
  // Note; Hook for programmatic navigation
  const navigate = useNavigate();

  // Note; Controlled inputs for route planning
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<string>('');
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);

  // Note; Check if the user is authenticated
  const isLoggedIn = Auth.loggedIn();

  // Note; Fetch saved trips only when logged in
  const { loading, error, data } = useQuery(QUERY_TRIPS, { skip: !isLoggedIn });
  const trips = data?.trips || [];

  // Note; Start the course search on button click
  const handleFindCourses = () => {
    setSearchTriggered(true);
  };

  return (
    <main className="home">
      {/* Note; Hero section with primary actions */}
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button
            className="btn btn--light home__btn"
            onClick={() => navigate('/plan-trip')}
          >
            Plan a Trip
          </button>
          <button
            className="btn btn--light home__btn"
            onClick={() => navigate('/saved-trips')}
          >
            View Saved Trips
          </button>
        </div>
      </section>

      {/* Note; Show search & map only for authenticated users */}
      {isLoggedIn ? (
        <>
          {/* Note; Inputs for origin, destination, max distance */}
          <section className="home__search">
            <input
              className="home__input"
              type="text"
              placeholder="Start Location"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <input
              className="home__input"
              type="text"
              placeholder="End Location"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <input
              className="home__input"
              type="text"
              placeholder="Max Distance (miles)"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
            />
            <button
              className="btn home__find-btn"
              onClick={handleFindCourses}
            >
              Find Courses
            </button>
          </section>

          {/* Note; Render Google Map view with route & course markers */}
          <section className="home__map">
            <GoogleMapView
              origin={searchTriggered ? origin : ''}
              destination={searchTriggered ? destination : ''}
              maxDistance={searchTriggered ? maxDistance : ''}
            />
          </section>
        </>
      ) : (
        /* Note; Prompt to log in when unauthenticated */
        <section className="home__locked">
          <p>Please log in to access trip planning and course search.</p>
        </section>
      )}

      {/* Note; Saved trips list for logged-in users */}
      {isLoggedIn && (
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

      {/* Note; Bottom navigation shortcuts */}
      <nav className="home__bottom-nav">
        <button
          className="home__nav-item btn--circle"
          onClick={() => navigate('/plan-trip')}
        >
          <FaMapMarkedAlt size={20} />
          <span>Map Routing</span>
        </button>
        <button
          className="home__nav-item btn--circle"
          onClick={() => navigate('/courses')}
        >
          <FaFlag size={20} />
          <span>Course Finder</span>
        </button>
        <button
          className="home__nav-item btn--circle"
          onClick={() => navigate('/weather')}
        >
          <FaCloudSun size={20} />
          <span>Weather</span>
        </button>
      </nav>
    </main>
  );
};

export default Home;
