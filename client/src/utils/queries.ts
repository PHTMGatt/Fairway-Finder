// client/src/utils/queries.ts

import { gql } from '@apollo/client';

/** ——— USER PROFILE QUERIES ——— **/

// Note; Fetch the currently authenticated user's profile, including their trips and players
export const QUERY_ME = gql`
  query Me {
    me {
      _id
      name
      skills
      trips {
        _id
        name
        date
        courses {
          _id
          name
        }
        players {
          name
        }
      }
    }
  }
`;

// Note; Fetch all user profiles (for admin or listing purposes)
export const QUERY_PROFILES = gql`
  query Profiles {
    profiles {
      _id
      name
      skills
    }
  }
`;

// Note; Fetch a single profile by its ID
export const QUERY_SINGLE_PROFILE = gql`
  query Profile($profileId: ID!) {
    profile(profileId: $profileId) {
      _id
      name
      skills
    }
  }
`;

/** ——— TRIP QUERIES ——— **/

// Note; Fetch every trip in the system
export const QUERY_TRIPS = gql`
  query Trips {
    trips {
      _id
      name
      date
      courses {
        _id
        name
      }
      players {
        name
      }
      handicap
    }
  }
`;

// ✅ Note; Updated to include players so Handicap Tracker works
export const QUERY_MY_TRIPS = gql`
  query MyTrips {
    me {
      _id
      name
      trips {
        _id
        name
        date
        courses {
          _id
          name
        }
        players {
          name
        }
        handicap
      }
    }
  }
`;

// Note; Fetch full trip including scorecard and handicap
export const QUERY_TRIP = gql`
  query Trip($id: ID!) {
    trip(id: $id) {
      _id
      name
      date
      courses {
        _id
        name
      }
      players {
        name
        score
        total
      }
      handicap
    }
  }
`;

// Note; Scorecard only
export const QUERY_SCORECARD = gql`
  query TripScorecard($id: ID!) {
    trip(id: $id) {
      _id
      name
      players {
        name
        score
        total
      }
    }
  }
`;
