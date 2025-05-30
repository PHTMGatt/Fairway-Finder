// client/src/components/CourseForm/'CourseForm.tsx'
import React, { useState, useCallback, FormEvent, ChangeEvent, memo, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import Auth from '../../utils/auth';
import { ADD_COURSE_TO_TRIP } from '../../utils/mutations';
import './CourseForm.css';

//Note; remastered CourseForm with memo, useMemo for auth check, lean markup
const CourseForm: React.FC<{ tripId: string }> = memo(({ tripId }) => {
  //Note; Local state for course name
  const [courseName, setCourseName] = useState<string>('');
  //Note; GraphQL mutation hook
  const [addCourseToTrip, { error }] = useMutation(ADD_COURSE_TO_TRIP);
  //Note; auth check memoized
  const isLoggedIn = useMemo(() => Auth.loggedIn(), []);

  //Note; input change handler
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCourseName(e.target.value);
  }, []);

  //Note; submit handler
  const handleAddCourse = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!courseName.trim()) return;
      try {
        await addCourseToTrip({ variables: { tripId, courseName } });
        setCourseName('');
      } catch {
        //Note; error displayed below
      }
    },
    [addCourseToTrip, tripId, courseName]
  );

  return (
    <div className="course-form">
      {/*Note; header*/}
      <h4 className="course-form__title">Add a course to your trip</h4>

      {isLoggedIn ? (
        <form className="course-form__form" onSubmit={handleAddCourse}>
          {/*Note; course name input*/}
          <input
            name="courseName"
            className="course-form__input"
            value={courseName}
            onChange={handleInputChange}
            placeholder="Enter golf course name..."
          />
          {/*Note; primary action button*/}
          <button
            type="submit"
            className="course-form__btn"
            disabled={!courseName.trim()}
          >
            Add Course
          </button>
        </form>
      ) : (
        //Note; login prompt
        <p className="course-form__prompt">
          Please <Link to="/login">login</Link> or <Link to="/signup">signup</Link> to add courses.
        </p>
      )}

      {error && <p className="course-form__error">Error: {error.message}</p>}
    </div>
  );
});

export default CourseForm;
