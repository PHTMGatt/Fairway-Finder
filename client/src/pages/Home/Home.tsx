import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';
import { useQuery } from '@apollo/client';
import { QUERY_TRIPS } from '../../utils/queries';
import TripList from '../../components/TripList/TripList';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import Auth from '../../utils/auth';
import './Home.css';

const Home: React.FC = () => {
  //Note; Hook for navigation
  const navigate = useNavigate();

  //Note; Controlled inputs
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [mapMountGate, setMapMountGate] = useState(false);

  //Note; Check authentication
  const isLoggedIn = Auth.loggedIn();

  //Note; Load user trips
  const { loading, error, data } = useQuery(QUERY_TRIPS, { skip: !isLoggedIn });
  const trips = data?.trips || [];

  //Note; Trigger course search
  const handleFindCourses = () => {
    setSearchTriggered(true);
  };

  //Note; Delay map render until DOM is mounted
  useEffect(() => {
    if (isLoggedIn) {
      const delay = setTimeout(() => setMapMountGate(true), 100);
      return () => clearTimeout(delay);
    }
  }, [isLoggedIn]);

  return (
    <main className="home">
      {/*Note; Hero buttons */}
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button className="btn btn--light home__btn" onClick={() => navigate('/plan-trip')}>
            Plan a Trip
          </button>
          <button className="btn btn--light home__btn" onClick={() => navigate('/saved-trips')}>
            View Saved Trips
          </button>
        </div>
      </section>

      {/*Note; Search + map section */}
      {isLoggedIn ? (
        <>
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
            <button className="btn home__find-btn" onClick={handleFindCourses}>
              Find Courses
            </button>
          </section>

          <section className="home__map">
            {mapMountGate && (
              <GoogleMapView
                origin={searchTriggered ? origin : ''}
                destination={searchTriggered ? destination : ''}
                maxDistance={searchTriggered ? maxDistance : ''}
                filters={[]}
              />
            )}
          </section>
        </>
      ) : (
        <section className="home__locked">
          <p>Please log in to access trip planning and course search.</p>
        </section>
      )}

      {/*Note; Saved trips section */}
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

      {/*Note; Footer nav icons */}
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
