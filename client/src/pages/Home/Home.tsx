import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';

import TripList from '../../components/TripList/TripList';
import GoogleMapView from '../../components/GoogleMap/GoogleMapView';
import { QUERY_TRIPS } from '../../utils/queries';
import Auth from '../../utils/auth';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);

  const loggedIn = Auth.loggedIn();
  const { loading, data, error } = useQuery(QUERY_TRIPS, { skip: !loggedIn });
  const trips = data?.trips || [];

  const handleSearch = () => setSearchTriggered(true);

  return (
    <main className="home">
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button className="btn btn--light home__btn" onClick={() => navigate('/routing')}>Plan a Trip</button>
          <button className="btn btn--light home__btn" onClick={() => navigate('/me')}>View Saved Trips</button>
        </div>
      </section>

      {loggedIn ? (
        <>
          <section className="home__search">
            <input
              className="home__input"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Start Location"
            />
            <input
              className="home__input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="End Location"
            />
            <input
              className="home__input"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              placeholder="Max Distance (miles)"
            />
            <button className="btn home__find-btn" onClick={handleSearch}>Find Courses</button>
          </section>

          <section className="home__map">
            <GoogleMapView
              origin={searchTriggered ? origin : ''}
              destination={searchTriggered ? destination : ''}
              maxDistance={searchTriggered ? maxDistance : ''}
            />
          </section>
        </>
      ) : (
        <section className="home__locked">
          <p>Please log in to access trip planning and course search.</p>
        </section>
      )}

      {loggedIn && (
        <section className="home__saved-trips container">
          {loading ? <p>Loading trips…</p> : error ? <p>Error: {error.message}</p> : <TripList trips={trips} title="Saved Trips" />}
        </section>
      )}

      <nav className="home__bottom-nav">
        <button className="home__nav-item btn--circle" onClick={() => navigate('/routing')}><FaMapMarkedAlt size={20} /><span>Map Routing</span></button>
        <button className="home__nav-item btn--circle" onClick={() => navigate('/courses')}><FaFlag size={20} /><span>Course Finder</span></button>
        <button className="home__nav-item btn--circle" onClick={() => navigate('/weather')}><FaCloudSun size={20} /><span>Weather</span></button>
      </nav>
    </main>
  );
};

export default Home;
