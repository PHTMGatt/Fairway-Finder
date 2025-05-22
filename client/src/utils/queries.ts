// src/utils/queries.ts
import { gql } from '@apollo/client';

/** ——— PROFILE QUERIES ——— **/

// Note; Fetch all user profiles with basic info
export const QUERY_PROFILES = gql`
  query allProfiles {
    profiles {
      _id
      name
      skills
    }
  }
`;

// Note; Fetch a single profile by its ID
export const QUERY_SINGLE_PROFILE = gql`
  query singleProfile($profileId: ID!) {
    profile(profileId: $profileId) {
      _id
      name
      skills
    }
  }
`;

// Note; Fetch current logged-in user's profile, skills, and trips
export const QUERY_ME = gql`
  query me {
    me {
      _id
      name
      skills
      trips {
        _id
        name
        courses {
          _id
          name
        }
      }
    }
  }
`;

/** ——— TRIP QUERIES ——— **/

// Note; Fetch all trips with their courses
export const QUERY_TRIPS = gql`
  query getAllTrips {
    trips {
      _id
      name
      courses {
        _id
        name
      }
    }
  }
`;

// Note; Fetch trips belonging to current logged-in user
export const QUERY_MY_TRIPS = gql`
  query getMyTrips {
    me {
      _id
      username
      trips {
        _id
        name
        courses {
          _id
          name
        }
      }
    }
  }
`;

// Note; Fetch a single trip by its ID with its courses
export const QUERY_TRIP = gql`
  query getTrip($id: ID!) {
    trip(id: $id) {
      _id
      name
      courses {
        _id
        name
      }
    }
  }
`;
