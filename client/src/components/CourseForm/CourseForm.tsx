import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { ADD_COURSE_TO_TRIP } from '../../utils/mutations';
import Auth from '../../utils/auth';
import './CourseForm.css';

interface CourseFormProps {
  tripId: string;
}

const CourseForm: React.FC<CourseFormProps> = ({ tripId }) => {
  const [courseName, setCourseName] = useState('');
  const [addCourse, { error }] = useMutation(ADD_COURSE_TO_TRIP);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addCourse({ variables: { tripId, courseName } });
      setCourseName('');
    } catch {
      // handle error if needed
    }
  };

  return (
    <div className="course-form">
      <h4 className="course-form__title">Add a course to your trip:</h4>

      {Auth.loggedIn() ? (
        <form className="course-form__form" onSubmit={handleSubmit}>
          <input
            className="course-form__input"
            placeholder="Enter golf course name..."
            value={courseName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCourseName(e.target.value)
            }
          />
          <button
            className="btn course-form__btn"
            type="submit"
            disabled={!courseName.trim()}
          >
            Add Course
          </button>
        </form>
      ) : (
        <p className="course-form__prompt">
          Please <Link to="/login">login</Link> or{' '}
          <Link to="/signup">signup</Link> to add courses.
        </p>
      )}

      {error && <p className="course-form__error">Error: {error.message}</p>}
    </div>
  );
};

export default CourseForm;
