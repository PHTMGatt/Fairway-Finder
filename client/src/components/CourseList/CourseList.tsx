import React from 'react';
import { useMutation } from '@apollo/client';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { QUERY_MY_TRIPS } from '../../utils/queries';
import './CourseList.css';

interface CourseListProps {
  courses?: string[];
  isLoggedInUser: boolean;
}

const CourseList: React.FC<CourseListProps> = ({ courses = [], isLoggedInUser }) => {
  const [removeCourse, { error }] = useMutation(REMOVE_COURSE_FROM_TRIP, {
    refetchQueries: [QUERY_MY_TRIPS, 'me'],
  });

  const handleRemove = async (courseName: string) => {
    try {
      await removeCourse({ variables: { courseName } });
    } catch (err) {
      console.error(err);
    }
  };

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
                className="btn btn-danger btn-sm course-card__remove"
                onClick={() => handleRemove(course)}
              >
                Remove
              </button>
            )}
          </h4>
        </div>
      ))}
      {error && <p className="course-list__error">Error: {error.message}</p>}
    </div>
  );
};

export default CourseList;
