// src/components/CourseForm/CourseForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import Auth from '../../utils/auth';
import { ADD_COURSE_TO_TRIP } from '../../utils/mutations';
import './CourseForm.css';

interface CourseFormProps {
  tripId: string;
}

const CourseForm: React.FC<CourseFormProps> = ({ tripId }) => {
  // Note; Local state for the course name input
  const [courseName, setCourseName] = useState<string>('');

  // Note; GraphQL mutation hook for adding a course to a trip
  const [addCourseToTrip, { error: addCourseError }] = useMutation(ADD_COURSE_TO_TRIP);

  // Note; Handler for input field changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCourseName(e.target.value);
  };

  // Note; Submit handler to execute the add-course mutation
  const handleAddCourse = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addCourseToTrip({
        variables: { tripId, courseName }
      });
      setCourseName(''); // Note; clear the input on success
    } catch {
      // Note; mutation error is displayed below
    }
  };

  return (
    <div className="course-form">
      {/* Note; Section header */}
      <h4 className="course-form__title">Add a course to your trip:</h4>

      {/* Note; Show form only when user is authenticated */}
      {Auth.loggedIn() ? (
        <form className="course-form__form" onSubmit={handleAddCourse}>
          {/* Note; Course name input */}
          <input
            name="courseName"
            className="course-form__input"
            value={courseName}
            onChange={handleInputChange}
            placeholder="Enter golf course name..."
          />
          {/* Note; Submit button */}
          <button
            type="submit"
            className="btn course-form__btn"
            disabled={!courseName.trim()}
          >
            Add Course
          </button>
        </form>
      ) : (
        /* Note; Prompt to login or signup if not authenticated */
        <p className="course-form__prompt">
          Please <Link to="/login">login</Link> or{' '}
          <Link to="/signup">signup</Link> to add courses.
        </p>
      )}

      {/* Note; Display any error from the mutation */}
      {addCourseError && (
        <p className="course-form__error">
          Error: {addCourseError.message}
        </p>
      )}
    </div>
  );
};

export default CourseForm;
