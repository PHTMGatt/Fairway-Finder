// client/src/utils/mutations.ts

import { gql } from '@apollo/client';

/** ——— AUTH & PROFILE MUTATIONS ——— **/

// Note; Registers a new user profile and returns auth token & basic profile info
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
`

// Note; Logs in an existing user and returns auth token & basic profile info
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
`

/** ——— TRIP MANAGEMENT MUTATIONS ——— **/

// Note; Creates a new trip with name, date, and empty courses list
export const ADD_TRIP = gql`
  mutation AddTrip($input: TripInput!) {
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
`

// Note; Adds a course to an existing trip by name
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
`

// Note; Removes a course from all trips that include it
export const REMOVE_COURSE_FROM_TRIP = gql`
  mutation RemoveCourseFromTrip($courseName: String!) {
    removeCourseFromTrip(courseName: $courseName) {
      _id
      name
      courses {
        _id
        name
      }
    }
  }
`

// Note; Deletes an entire trip by its ID
export const DELETE_TRIP = gql`
  mutation DeleteTrip($tripId: ID!) {
    deleteTrip(tripId: $tripId) {
      _id
      name
    }
  }
`

/** ——— SCORECARD MANAGEMENT MUTATIONS ——— **/

// Note; Adds a player to a trip’s scorecard
export const ADD_PLAYER = gql`
  mutation AddPlayer($tripId: ID!, $name: String!) {
    addPlayer(tripId: $tripId, name: $name) {
      _id
      name
    }
  }
`

// Note; Removes a player from a trip’s scorecard
export const REMOVE_PLAYER = gql`
  mutation RemovePlayer($tripId: ID!, $name: String!) {
    removePlayer(tripId: $tripId, name: $name) {
      _id
      name
    }
  }
`

// Note; Updates a single player’s score on a specific hole
export const UPDATE_SCORE = gql`
  mutation UpdateScore(
    $tripId: ID!
    $player: String!
    $hole: Int!
    $score: Int!
  ) {
    updateScore(
      tripId: $tripId
      player: $player
      hole: $hole
      score: $score
    ) {
      _id
      name
    }
  }
`
