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

export const RESET_GUEST_DEMO = gql`
  mutation ResetGuestDemo {
    resetGuestDemo {
      _id
      isGuest
      expiresAt
      trips {
        _id
        name
        date
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

const SCORECARD_TRIP_FIELDS = gql`
  fragment ScorecardTripFields on Trip {
    _id
    players {
      name
      score
      total
      handicap
    }
  }
`;

/** ——— SCORECARD MANAGEMENT MUTATIONS ——— **/

export const ADD_PLAYER = gql`
  mutation AddPlayer($tripId: ID!, $name: String!) {
    addPlayer(tripId: $tripId, name: $name) {
      ...ScorecardTripFields
    }
  }
  ${SCORECARD_TRIP_FIELDS}
`;

export const REMOVE_PLAYER = gql`
  mutation RemovePlayer($tripId: ID!, $name: String!) {
    removePlayer(tripId: $tripId, name: $name) {
      ...ScorecardTripFields
    }
  }
  ${SCORECARD_TRIP_FIELDS}
`;

export const UPDATE_SCORE = gql`
  mutation UpdateScore($tripId: ID!, $player: String!, $hole: Int!, $score: Int!) {
    updateScore(tripId: $tripId, player: $player, hole: $hole, score: $score) {
      ...ScorecardTripFields
    }
  }
  ${SCORECARD_TRIP_FIELDS}
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
      ...ScorecardTripFields
    }
  }
  ${SCORECARD_TRIP_FIELDS}
`;

/** ——— EMAIL CODES (sign-up verification + password reset) ——— **/

export const REQUEST_SIGNUP_CODE = gql`
  mutation RequestSignupCode($input: SignupInput!) {
    requestSignupCode(input: $input)
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($email: String!, $code: String!) {
    verifyEmail(email: $email, code: $code) {
      token
      profile {
        _id
        name
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $code: String!, $password: String!) {
    resetPassword(email: $email, code: $code, password: $password) {
      token
      profile {
        _id
        name
      }
    }
  }
`;
