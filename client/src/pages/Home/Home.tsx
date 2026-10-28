// client/src/pages/Home/Home.tsx

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudSun, FaFlag, FaMapMarkedAlt } from 'react-icons/fa';
import { useQuery } from '@apollo/client';
import { QUERY_TRIPS } from '../../utils/queries';
import TripList from '../../components/TripList/TripList';
import GuestDemoButton from '../../components/GuestDemoButton';
import Auth from '../../utils/auth';
import { getHomePrimaryActions, getHomeTools } from './homeModel';
import './Home.css';

const toolIcons: Record<string, ReactNode> = {
  'Course Finder': <FaFlag aria-hidden="true" />,
  'Route Planner': <FaMapMarkedAlt aria-hidden="true" />,
  Weather: <FaCloudSun aria-hidden="true" />,
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = Auth.loggedIn();
  const primaryActions = getHomePrimaryActions(isLoggedIn);
  const tools = getHomeTools();

  const { loading, error, data } = useQuery(QUERY_TRIPS, {
    skip: !isLoggedIn,
  });
  const trips = data?.trips || [];

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="home-title">
        <p className="home__eyebrow">Golf trips, organized.</p>
        <h1 id="home-title" className="home__title">
          Plan the round. Keep the trip together.
        </h1>
        <p className="home__subtitle">
          Choose a course, save the trip, then come back to one place for course details,
          weather, routing, players, and scores.
        </p>

        <div className="home__buttons">
          {primaryActions.map((action, index) => (
            <button
              key={action.path}
              className={`home__btn${index === 0 ? ' home__btn--primary' : ''}`}
              onClick={() => navigate(action.path)}
            >
              {action.label}
            </button>
          ))}
        </div>

        {!isLoggedIn && (
          <div className="home__guest">
            <span>Want to look around without creating an account?</span>
            <GuestDemoButton className="home__btn home__btn--guest" />
          </div>
        )}
      </section>

      <section className="home__workflow" aria-labelledby="workflow-title">
        <div className="home__section-heading">
          <p className="home__eyebrow">The simple path</p>
          <h2 id="workflow-title">From course search to game day</h2>
        </div>
        <div className="home__steps">
          <article className="home__step">
            <span>1</span>
            <h3>Pick a course</h3>
            <p>Search a city and choose the actual course you want to play.</p>
          </article>
          <article className="home__step">
            <span>2</span>
            <h3>Save the trip</h3>
            <p>Keep the date, course identity, address, and location tied to the trip.</p>
          </article>
          <article className="home__step">
            <span>3</span>
            <h3>Use the trip hub</h3>
            <p>Reopen it later for weather, maps, players, scoring, and course details.</p>
          </article>
        </div>
      </section>

      {isLoggedIn && (
        <section className="home__saved-trips" aria-labelledby="saved-trips-title">
          <div className="home__section-heading home__section-heading--row">
            <div>
              <p className="home__eyebrow">Continue where you left off</p>
              <h2 id="saved-trips-title">Your trips</h2>
            </div>
            <button className="home__text-link" onClick={() => navigate('/saved-trips')}>
              View all
            </button>
          </div>

          {loading ? (
            <p className="home__status">Loading trips…</p>
          ) : error ? (
            <p className="home__status home__status--error">Unable to load trips: {error.message}</p>
          ) : trips.length ? (
            <TripList trips={trips} title="" />
          ) : (
            <div className="home__empty">
              <strong>No trips yet.</strong>
              <span>Start with a course and build your first trip.</span>
              <button className="home__btn home__btn--primary" onClick={() => navigate('/plan-trip')}>
                Plan your first trip
              </button>
            </div>
          )}
        </section>
      )}

      <section className="home__tools" aria-labelledby="tools-title">
        <div className="home__section-heading">
          <p className="home__eyebrow">Quick tools</p>
          <h2 id="tools-title">Need one thing right now?</h2>
          <p>These are still available without turning the home screen into three separate apps.</p>
        </div>
        <nav className="home__tool-grid" aria-label="Fairway Finder tools">
          {tools.map((tool) => (
            <button key={tool.path} className="home__tool" onClick={() => navigate(tool.path)}>
              <span className="home__tool-icon">{toolIcons[tool.label]}</span>
              <strong>{tool.label}</strong>
              <span>Open tool</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
};

export default Home;
