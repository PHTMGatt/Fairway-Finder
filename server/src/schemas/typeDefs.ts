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
    "True for a temporary Guest Demo account."
    isGuest: Boolean
    "When a Guest Demo and its trips are deleted (ISO 8601); null for permanent accounts."
    expiresAt: String
  }

  """
  Authentication payload: JWT plus the authenticated profile.
  """
  type Auth {
    token: ID!
    profile: Profile
  }

  """
  A canonical selected-course snapshot embedded in a trip. Provider identity and
  enrichment fields are optional so legacy name-only trips remain compatible.
  """
  type Course {
    _id: ID
    name: String
    source: String
    providerId: String
    address: String
    location: Location
    rating: Float
    golfCourseApiId: String
    courseRating: Float
    slope: Int
  }

  """
  Latitude/longitude coordinate pair.
  """
  type Location {
    lat: Float
    lng: Float
  }

  input LocationInput {
    lat: Float!
    lng: Float!
  }

  input TripCourseInput {
    name: String!
    source: String
    providerId: String
    address: String
    location: LocationInput
    rating: Float
    golfCourseApiId: String
    courseRating: Float
    slope: Int
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

  """
  Sign-up details. Permanent accounts are invite-only, so a valid invite code is required.
  """
  input ProfileInput {
    name: String!
    email: String!
    password: String!
    inviteCode: String!
  }

  """
  New clients send a structured course snapshot. courseName remains temporarily
  supported for older clients while the trip-planning flow is migrated.
  """
  input TripInput {
    name: String!
    date: String!
    course: TripCourseInput
    courseName: String
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

    """
    Start an anonymous Guest Demo: a temporary account seeded with fake sample data and deleted after 24 hours.
    """
    startGuestSession: Auth

    """
    Reset only the currently authenticated Guest Demo account to its canonical fake sample data.
    Permanent accounts cannot call this mutation.
    """
    resetGuestDemo: Profile

    addTrip(input: TripInput!): Trip
    deleteTrip(tripId: ID!): Trip
    addCourseToTrip(tripId: ID!, courseName: String!): Trip
    removeCourseFromTrip(tripId: ID!, courseId: ID!): Trip
    addPlayer(tripId: ID!, name: String!): Trip
    removePlayer(tripId: ID!, name: String!): Trip
    updateScore(tripId: ID!, player: String!, hole: Int!, score: Int!): Trip
    updateTripHandicap(tripId: ID!, handicap: Float!): Trip
    updatePlayerHandicap(tripId: ID!, name: String!, handicap: Float!): Trip
  }
`;