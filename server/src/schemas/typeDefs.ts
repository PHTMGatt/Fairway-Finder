// server/src/schemas/typeDefs.ts

export default `  
  scalar JSON

  """
  A user profile containing public account fields and that user's associated trips.
  Password hashes are intentionally never exposed through GraphQL.
  """
  type Profile {
    _id: ID
    name: String
    email: String
    trips: [Trip]
  }

  """
  Authentication payload: JWT plus the authenticated profile.
  """
  type Auth {
    token: ID!
    profile: Profile
  }

  """
  A golf course, including cached rating and slope for handicap calculations.
  """
  type Course {
    _id: ID
    name: String
    address: String
    location: Location
    rating: Float
    slope: Int
  }

  """
  Latitude/longitude coordinate pair.
  """
  type Location {
    lat: Float
    lng: Float
  }

  """
  A player on a trip, with per-hole scores, total, and individual handicap index.
  """
  type Player {
    name: String
    score: JSON
    total: Int
    handicap: Float
  }

  """
  A trip owned by one authenticated profile.
  """
  type Trip {
    _id: ID
    name: String
    date: String
    courses: [Course]
    players: [Player]
    handicap: Float
  }

  input ProfileInput {
    name: String!
    email: String!
    password: String!
  }

  input TripInput {
    name: String!
    date: String!
    courseName: String!
  }

  type Query {
    """
    Fetch the currently logged-in user's profile and only their trips.
    """
    me: Profile

    """
    Fetch only trips belonging to the currently logged-in user.
    """
    trips: [Trip]

    """
    Fetch one trip only when it belongs to the currently logged-in user.
    """
    trip(id: ID!): Trip
  }

  type Mutation {
    addProfile(input: ProfileInput!): Auth
    login(email: String!, password: String!): Auth

    addTrip(input: TripInput!): Trip
    deleteTrip(tripId: ID!): Trip
    addCourseToTrip(tripId: ID!, courseName: String!): Trip
    removeCourseFromTrip(courseName: String!): Trip
    addPlayer(tripId: ID!, name: String!): Trip
    removePlayer(tripId: ID!, name: String!): Trip
    updateScore(tripId: ID!, player: String!, hole: Int!, score: Int!): Trip
    updateTripHandicap(tripId: ID!, handicap: Float!): Trip
    updatePlayerHandicap(tripId: ID!, name: String!, handicap: Float!): Trip
  }
`;
