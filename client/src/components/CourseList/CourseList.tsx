// src/components/CourseList/CourseList.tsx

import React from 'react';
import { useMutation } from '@apollo/client';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './CourseList.css';

// Note; Props expected: course list and user status
interface CourseListProps {
  courses?: string[]; // Note; Optional array of course names
  isLoggedInUser: boolean; // Note; Controls remove button visibility
}

const CourseList: React.FC<CourseListProps> = ({
  courses = [],
  isLoggedInUser,
}) => {
  // Note; Setup mutation for removing a course from a trip
  const [removeCourse, { error }] = useMutation(REMOVE_COURSE_FROM_TRIP, {
    refetchQueries: [QUERY_MY_TRIPS, 'me'], // Note; Refresh user trip data after removal
  });

  // Note; Remove button click handler
  const handleRemove = async (courseName: string) => {
    try {
      await removeCourse({ variables: { courseName } });
    } catch (err) {
      console.error(err); // Note; Catch mutation errors
    }
  };

  // Note; Show fallback message if no courses present
  if (!courses.length) {
    return <h3 className="course-list__empty">No Courses Added Yet</h3>;
  }

  return (
    <div className="course-list">
      {courses.map((course) => (
        <div key={course} className="course-card">
          <h4 className="course-card__name">
            {course}
            {isLoggedInUser && (
              <button
                className="course-card__remove"
                onClick={() => handleRemove(course)}
              >
                Remove
              </button>
            )}
          </h4>
        </div>
      ))}
      {/* Note; Show error if mutation fails */}
      {error && <p className="course-list__error">Error: {error.message}</p>}
    </div>
  );
};

export default CourseList;
