// src/utils/queries.ts
import { gql } from '@apollo/client';

/** ——— PROFILE QUERIES ——— **/

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
