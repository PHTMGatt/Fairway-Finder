// client/src/pages/Home.jsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';

import TripList from '../components/TripList';
import { QUERY_TRIPS } from '../utils/queries';
import './Home.css';

const Home = () => {
  const { loading, data, error } = useQuery(QUERY_TRIPS);
  const trips = data?.trips || [];

  return (
    <main className="home">
      {/* ——— Hero Section ——— */}
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button className="btn home__btn">Plan a Trip</button>
          <button className="btn home__btn">View Saved Trips</button>
        </div>
      </section>

      {/* ——— Search Form ——— */}
      <section className="home__search">
        <input className="home__input" type="text" placeholder="Start Location" />
        <input className="home__input" type="text" placeholder="End Location" />
        <input className="home__input" type="text" placeholder="Max Distance" />
        <button className="btn home__find-btn">Find Courses</button>
      </section>

      {/* ——— Map Preview ——— */}
      <section className="home__map">
        <div className="home__map-placeholder">Map goes here</div>
      </section>

      {/* ——— Saved Trips Listing ——— */}
      <section className="home__saved-trips container">
        {loading ? (
          <p>Loading trips…</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : (
          <TripList trips={trips} title="Saved Trips" />
        )}
      </section>

      {/* ——— Bottom Icon Nav ——— */}
      <nav className="home__bottom-nav">
        <Link to="/routing" className="home__nav-item">
          <FaMapMarkedAlt size={24} />
          <span>Map Routing</span>
        </Link>
        <Link to="/courses" className="home__nav-item">
          <FaFlag size={24} />
          <span>Course Finder</span>
        </Link>
        <Link to="/weather" className="home__nav-item">
          <FaCloudSun size={24} />
          <span>Weather</span>
        </Link>
      </nav>
    </main>
  );
};

export default Home;
