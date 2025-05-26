// src/components/CourseList/CourseList.tsx

import React from 'react';
import { useMutation } from '@apollo/client';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './CourseList.css';

interface CourseListProps {
  courses?: string[];          // Note; Optional array of course names
  isLoggedInUser: boolean;     // Note; Controls visibility of remove buttons
}

const CourseList: React.FC<CourseListProps> = ({
  courses = [],
  isLoggedInUser,
}) => {
  // Note; GraphQL mutation hook for removing a course, refetching trips after
  const [removeCourseFromTrip, { error: removeCourseError }] = useMutation(
    REMOVE_COURSE_FROM_TRIP,
    {
      refetchQueries: [{ query: QUERY_MY_TRIPS }],
    }
  );

  // Note; Handler invoked when clicking “Remove”
  const handleCourseRemove = async (courseName: string) => {
    try {
      await removeCourseFromTrip({ variables: { courseName } });
    } catch {
      // Note; any error displayed below
    }
  };

  // Note; Fallback when no courses have been added
  if (courses.length === 0) {
    return <h3 className="course-list__empty">No Courses Added Yet</h3>;
  }

  return (
    <div className="course-list">
      {courses.map((course) => (
        <div key={course} className="course-card">
          <h4 className="course-card__name">
            {course}
            {/* Note; Only show Remove if this user owns the trip */}
            {isLoggedInUser && (
              <button
                className="course-card__remove"
                onClick={() => handleCourseRemove(course)}
              >
                Remove
              </button>
            )}
          </h4>
        </div>
      ))}

      {/* Note; Display any mutation error here */}
      {removeCourseError && (
        <p className="course-list__error">
          Error: {removeCourseError.message}
        </p>
      )}
    </div>
  );
};

export default CourseList;
