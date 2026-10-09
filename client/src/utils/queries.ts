// client/src/utils/queries.ts

import { gql } from '@apollo/client';

/** ——— CURRENT USER QUERIES ——— **/

export const QUERY_ME = gql`
  query Me {
    me {
      _id
      name
      email
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
          handicap
        }
        handicap
      }
    }
  }
`;

/** ——— TRIP QUERIES ——— **/

// The server scopes this result to the authenticated user's trip IDs.
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
        handicap
      }
      handicap
    }
  }
`;

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
          handicap
        }
        handicap
      }
    }
  }
`;

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
        handicap
      }
      handicap
    }
  }
`;

export const QUERY_SCORECARD = gql`
  query TripScorecard($id: ID!) {
    trip(id: $id) {
      _id
      name
      players {
        name
        score
        total
        handicap
      }
    }
  }
`;
