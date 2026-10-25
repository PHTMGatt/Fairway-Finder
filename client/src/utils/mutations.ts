import { gql } from '@apollo/client';

/** ——— AUTH & PROFILE MUTATIONS ——— **/

export const ADD_PROFILE = gql`
  mutation AddProfile($input: ProfileInput!) {
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
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      profile {
        _id
        name
      }
    }
  }
`;

export const START_GUEST_SESSION = gql`
  mutation StartGuestSession {
    startGuestSession {
      token
      profile {
        _id
        name
        isGuest
        expiresAt
      }
    }
  }
`;

/** ——— TRIP MANAGEMENT MUTATIONS ——— **/

export const ADD_TRIP = gql`
  mutation AddTrip($input: TripInput!) {
    addTrip(input: $input) {
      _id
      name
      date
      courses {
        _id
        name
        source
        providerId
        address
        location { lat lng }
        rating
        golfCourseApiId
        courseRating
        slope
      }
    }
  }
`;

export const ADD_COURSE_TO_TRIP = gql`
  mutation AddCourseToTrip($tripId: ID!, $courseName: String!) {
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
  mutation RemoveCourseFromTrip($tripId: ID!, $courseId: ID!) {
    removeCourseFromTrip(tripId: $tripId, courseId: $courseId) {
      _id
      name
      courses {
        _id
        name
      }
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

/** ——— SCORECARD MANAGEMENT MUTATIONS ——— **/

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

/** ——— HANDICAP MUTATIONS ——— **/

export const UPDATE_HANDICAP = gql`
  mutation UpdateTripHandicap($tripId: ID!, $handicap: Float!) {
    updateTripHandicap(tripId: $tripId, handicap: $handicap) {
      _id
      handicap
    }
  }
`;

export const UPDATE_PLAYER_HANDICAP = gql`
  mutation UpdatePlayerHandicap($tripId: ID!, $name: String!, $handicap: Float!) {
    updatePlayerHandicap(tripId: $tripId, name: $name, handicap: $handicap) {
      _id
      name
      players {
        name
        handicap
      }
    }
  }
`;
