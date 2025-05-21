// src/utils/mutations.ts
import { gql } from '@apollo/client';

/** ——— AUTHENTICATION & PROFILE ——— **/

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

export const ADD_TRIP = gql`
  mutation addTrip($name: String!) {
    addTrip(name: $name) {
      _id
      name
    }
  }
`;

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
