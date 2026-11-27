// client/src/pages/Trips/TripCoursePanel.tsx
import React from 'react';
import { FaMapMarkerAlt, FaRoute, FaStar } from 'react-icons/fa';
import Notice from '../../components/ui/Notice';
import { Button, Chip, Panel } from '../../components/ui/primitives';
import { PersistedTripCourse, TeeRating } from './tripDetailsCourse';

export interface TripCourse extends PersistedTripCourse {
  _id?: string;
  address?: string | null;
  rating?: number | null;
}

const mapsLink = (course: TripCourse, query: string) => {
  const placeId = course.source === 'google' ? course.providerId : null;
  const suffix = placeId ? `&query_place_id=${encodeURIComponent(placeId)}` : '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${suffix}`;
};

interface TripCoursePanelProps {
  course?: TripCourse;
  teeRating: TeeRating | null;
  teeError: string;
}

const TripCoursePanel: React.FC<TripCoursePanelProps> = ({ course, teeRating, teeError }) => {
  const destination = [course?.name, course?.address].filter(Boolean).join(' ');

  return (
    <Panel title="Course">
      <h3 className="trip-details__course-name">{course?.name ?? 'No course selected'}</h3>
      <p className="trip-details__muted">{course?.address ?? 'No address available'}</p>

      {(typeof course?.rating === 'number' || teeRating) && (
        <div className="trip-details__chips">
          {typeof course?.rating === 'number' && (
            <Chip icon={<FaStar />}>{course.rating} Google rating</Chip>
          )}
          {teeRating && (
            <Chip>
              Rating {teeRating.courseRating} · Slope {teeRating.slopeRating}
            </Chip>
          )}
        </div>
      )}

      {teeError && (
        <Notice tone="danger" className="trip-details__alert">
          {teeError}
        </Notice>
      )}

      {course?.name && (
        <div className="trip-details__actions">
          <Button to="/routing" state={{ destination }} icon={<FaRoute />}>
            Plan Route
          </Button>
          <Button
            variant="secondary"
            href={mapsLink(course, destination)}
            target="_blank"
            rel="noopener noreferrer"
            icon={<FaMapMarkerAlt />}
          >
            Open in Maps
          </Button>
        </div>
      )}
    </Panel>
  );
};

export default TripCoursePanel;
