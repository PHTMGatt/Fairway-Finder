import { gql } from '@apollo/client';

/** ——— TRIP QUERIES ——— **/

// Fetch full trip including our new `score` object.
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
        score    # unified JSON object H1…H18
        total    # server-computed total
      }
    }
  }
`

// If you only need scorecard data:
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
`
