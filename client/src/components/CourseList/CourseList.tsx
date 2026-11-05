// client/src/components/CourseList/CourseList.tsx
import React, { useCallback, memo, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './CourseList.css';

interface CourseListCourse {
  _id: string;
  name: string;
}

interface CourseListProps {
  tripId: string;
  courses?: CourseListCourse[];
  isLoggedInUser: boolean;
}

const CourseList: React.FC<CourseListProps> = memo(({
  tripId,
  courses = [],
  isLoggedInUser,
}) => {
  const showRemove = useMemo(() => isLoggedInUser, [isLoggedInUser]);

  const [removeCourseFromTrip, { error: removeCourseError }] = useMutation(
    REMOVE_COURSE_FROM_TRIP,
    { refetchQueries: [{ query: QUERY_MY_TRIPS }] }
  );

  const handleCourseRemove = useCallback(
    async (courseId: string) => {
      try {
        await removeCourseFromTrip({ variables: { tripId, courseId } });
      } catch {
        // Apollo exposes the mutation error below.
      }
    },
    [removeCourseFromTrip, tripId]
  );

  if (courses.length === 0) {
    return <h3 className="course-list__empty">No Courses Added Yet</h3>;
  }

  return (
    <div className="course-list">
      {courses.map((course) => (
        <div key={course._id} className="course-card">
          <h4 className="course-card__name">
            {course.name}
            {showRemove && (
              <button
                className="course-card__remove"
                onClick={() => handleCourseRemove(course._id)}
              >
                Remove
              </button>
            )}
          </h4>
        </div>
      ))}
      {removeCourseError && (
        <p className="course-list__error">Error: {removeCourseError.message}</p>
      )}
    </div>
  );
});

export default CourseList;
