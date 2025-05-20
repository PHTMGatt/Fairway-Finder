// src/pages/Home.jsx

import React from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaFlag, FaCloudSun } from 'react-icons/fa';

import TripList from '../components/TripList';
import { QUERY_TRIPS } from '../utils/queries';
import './Home.css';

const Home = () => {
  const { loading, data, error } = useQuery(QUERY_TRIPS);
  const trips = data?.trips || [];
  const navigate = useNavigate();

  return (
    <main className="home">
      {/* ——— Hero Section ——— */}
      <section className="home__hero">
        <h2 className="home__title">Plan your next golf adventure.</h2>
        <div className="home__buttons">
          <button
            className="btn home__btn"
            onClick={() => navigate('/routing')}
          >
            Plan a Trip
          </button>
          <button
            className="btn home__btn"
            onClick={() => navigate('/me')}
          >
            View Saved Trips
          </button>
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
        <button
          className="home__nav-item"
          onClick={() => navigate('/routing')}
        >
          <FaMapMarkedAlt size={24} />
          <span>Map Routing</span>
        </button>
        <button
          className="home__nav-item"
          onClick={() => navigate('/courses')}
        >
          <FaFlag size={24} />
          <span>Course Finder</span>
        </button>
        <button
          className="home__nav-item"
          onClick={() => navigate('/weather')}
        >
          <FaCloudSun size={24} />
          <span>Weather</span>
        </button>
      </nav>
    </main>
  );
};

export default Home;
