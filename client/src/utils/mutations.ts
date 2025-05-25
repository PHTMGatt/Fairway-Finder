import { gql } from '@apollo/client';

/** ——— AUTH & PROFILE ——— **/

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
  mutation addTrip($input: TripInput!) {
    addTrip(input: $input) {
      _id
      name
      date
      courses {
        _id
        name
      }
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

/** ——— SCORECARD MANAGEMENT ——— **/

export const ADD_PLAYER = gql`
  mutation AddPlayer($tripId: ID!, $name: String!) {
    addPlayer(tripId: $tripId, name: $name) {
      _id
      name
    }
  }
`;

export const REMOVE_PLAYER = gql`
  mutation RemovePlayer($tripId: ID!, $name: String!) {
    removePlayer(tripId: $tripId, name: $name) {
      _id
      name
    }
  }
`;

export const UPDATE_SCORE = gql`
  mutation UpdateScore($tripId: ID!, $player: String!, $hole: Int!, $score: Int!) {
    updateScore(tripId: $tripId, player: $player, hole: $hole, score: $score) {
      _id
      name
    }
  }
`;

export const DELETE_TRIP = gql`
  mutation DeleteTrip($tripId: ID!) {
    deleteTrip(tripId: $tripId) {
      _id
      name
    }
  }
`;

