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
        date
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
      date
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
      name
      trips {
        _id
        name
        date
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
      date
      courses {
        _id
        name
      }
      players {
        name
        scores {
          hole
          score
        }
      }
    }
  }
`;

/** ——— SCORECARD QUERY (optional alias of above) ——— **/

export const QUERY_SCORECARD = gql`
  query getTripScorecard($id: ID!) {
    trip(id: $id) {
      _id
      name
      players {
        name
        scores {
          hole
          score
        }
      }
    }
  }
`;
