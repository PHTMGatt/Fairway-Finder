// client/src/utils/queries.ts
import { gql } from '@apollo/client';

/** ——— EXISTING PROFILE QUERIES ——— */

export const QUERY_PROFILES = gql`
  query allProfiles {
    profiles {
      _id
      name
      skills
    }
  }
`;

export const QUERY_SINGLE_PROFILE = gql`
  query singleProfile($profileId: ID!) {
    profile(profileId: $profileId) {
      _id
      name
      skills
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
      _id
      name
      skills
    }
  }
`;

/** ——— NEW FAIRWAY FINDER TRIP QUERIES ——— */

// Fetch all trips for listing
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

// Fetch the logged-in user and their trips
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
