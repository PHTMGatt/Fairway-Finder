// src/components/CourseForm/CourseForm.tsx

import React, { useState, ChangeEvent, FormEvent } from 'react';
import './CourseForm.css';

//Note; Props passed into the component
interface CourseFormProps {
  tripId: string; //Note; Used to link the new course to a specific trip
}

const CourseForm: React.FC<CourseFormProps> = ({ tripId }) => {
  //Note; Local state for the course name input
  const [courseName, setCourseName] = useState('');

  //Note; Mutation hook to add a course to a trip
  const [addCourse, { error }] = useMutation(ADD_COURSE_TO_TRIP);

  //Note; Handles form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      //Note; Call mutation to add the course
      await addCourse({ variables: { tripId, courseName } });
      setCourseName(''); //Note; Reset input after submission
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="course-form">
      <h4 className="course-form__title">Add a course to your trip:</h4>

      {Auth.loggedIn() ? (
        //Note; If logged in, show the course input form
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
        //Note; If not logged in, prompt to login or signup
        <p className="course-form__prompt">
          Please <Link to="/login">login</Link> or{' '}
          <Link to="/signup">signup</Link> to add courses.
        </p>
      )}

      {/*Note; Display any mutation error*/}
      {error && <p className="course-form__error">Error: {error.message}</p>}
    </div>
  );
};

export default CourseForm;
