// src/utils/mutations.ts
import { gql } from '@apollo/client';

/** ——— AUTHENTICATION & PROFILE ——— **/

// Note; Mutation to register a new user profile and receive JWT
export const ADD_PROFILE = gql`
  mutation addProfile($input: ProfileInput!) {
    addProfile(input: $input) {
      token
      profile {
        _id
        name
      }
    }
  }
`;

// Note; Mutation to log in existing user and receive JWT
export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      profile {
        _id
        name
      }
    }
  }
`;

/** ——— TRIP MANAGEMENT ——— **/

// Note; Mutation to create a new trip with a given name
export const ADD_TRIP = gql`
  mutation addTrip($name: String!) {
    addTrip(name: $name) {
      _id
      name
    }
  }
`;

// Note; Mutation to add a course by name to an existing trip
export const ADD_COURSE_TO_TRIP = gql`
  mutation addCourseToTrip($tripId: ID!, $courseName: String!) {
    addCourseToTrip(tripId: $tripId, courseName: $courseName) {
      _id
      name
      courses {
        _id
        name
      }
    }
  }
`;

// Note; Mutation to remove a course by name from the user's trip
export const REMOVE_COURSE_FROM_TRIP = gql`
  mutation removeCourseFromTrip($courseName: String!) {
    removeCourseFromTrip(courseName: $courseName) {
      _id
      name
      courses {
        _id
        name
      }
    }
  }
`;
