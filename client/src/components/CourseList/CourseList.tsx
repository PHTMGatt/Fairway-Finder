// client/src/components/CourseList/'CourseList.tsx'
import React, { useCallback, memo, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './CourseList.css';

//Note; remastered CourseList with memo, useMemo for login check
interface CourseListProps {
  courses?: string[];
  isLoggedInUser: boolean;
}

const CourseList: React.FC<CourseListProps> = memo(({ courses = [], isLoggedInUser }) => {
  //Note; auth check memoized (if needed elsewhere)
  const showRemove = useMemo(() => isLoggedInUser, [isLoggedInUser]);

  //Note; GraphQL remove mutation with refetch
  const [removeCourseFromTrip, { error: removeCourseError }] = useMutation(
    REMOVE_COURSE_FROM_TRIP,
    { refetchQueries: [{ query: QUERY_MY_TRIPS }] }
  );

  //Note; remove handler
  const handleCourseRemove = useCallback(
    async (courseName: string) => {
      try {
        await removeCourseFromTrip({ variables: { courseName } });
      } catch {
        //Note; error displayed below
      }
    },
    [removeCourseFromTrip]
  );

  if (courses.length === 0) {
    return <h3 className="course-list__empty">No Courses Added Yet</h3>;
  }

  return (
    <div className="course-list">
      {courses.map((course) => (
        <div key={course} className="course-card">
          <h4 className="course-card__name">
            {course}
            {showRemove && (
              //Note; removal button styled as primary-action
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
      {removeCourseError && (
        <p className="course-list__error">Error: {removeCourseError.message}</p>
      )}
    </div>
  );
});

export default CourseList;
