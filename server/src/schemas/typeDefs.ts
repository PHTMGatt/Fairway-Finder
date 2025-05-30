// server/schemas/typeDefs.ts

export default `  
  scalar JSON

  """
  A user profile, containing basic info and their associated trips.
  """
  type Profile {
    _id: ID
    name: String
    email: String
    password: String
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
    rating: Float    # cached courseRating for handicap calc
    slope: Int       # cached slopeRating for handicap calc
  }

  """
  Latitude/longitude coordinate pair.
  """
  type Location {
    lat: Float
    lng: Float
  }

  """
  A player on a trip, with per-hole scores and total.
  """
  type Player {
    name: String
    score: JSON
    total: Int
  }

  """
  A Trip document: name, date, courses played, players and their scores, and the trip handicap index.
  """
  type Trip {
    _id: ID
    name: String
    date: String
    courses: [Course]
    players: [Player]
    handicap: Float  # stored handicap index for this trip
  }

  """
  Input for creating a new user profile.
  """
  input ProfileInput {
    name: String!
    email: String!
    password: String!
  }

  """
  Input for creating a new trip.  
  The server will look up the course by name and cache its rating+slope.
  """
  input TripInput {
    name: String!
    date: String!
    courseName: String!
  }

  type Query {
    """
    Fetch the currently logged-in user's profile.
    """
    me: Profile

    """
    Fetch all profiles (dev use).
    """
    profiles: [Profile]

    """
    Fetch one profile by ID.
    """
    profile(profileId: ID!): Profile

    """
    Fetch all trips (dev use).
    """
    trips: [Trip]

    """
    Fetch one trip by ID.
    """
    trip(id: ID!): Trip
  }

  type Mutation {
    """
    Register a new user and return an auth payload.
    """
    addProfile(input: ProfileInput!): Auth

    """
    Log in an existing user.
    """
    login(email: String!, password: String!): Auth

    """
    Create a new trip and cache initial course's rating+slope.
    """
    addTrip(input: TripInput!): Trip

    """
    Delete a trip by ID.
    """
    deleteTrip(tripId: ID!): Trip

    """
    Add an additional course to an existing trip.
    """
    addCourseToTrip(tripId: ID!, courseName: String!): Trip

    """
    Remove a course from a trip.
    """
    removeCourseFromTrip(courseName: String!): Trip

    """
    Add a new player to a trip.
    """
    addPlayer(tripId: ID!, name: String!): Trip

    """
    Remove a player from a trip.
    """
    removePlayer(tripId: ID!, name: String!): Trip

    """
    Update a single player's score for a specific hole.
    """
    updateScore(tripId: ID!, player: String!, hole: Int!, score: Int!): Trip

    """
    Recalculate and store the trip's handicap index.
    """
    updateTripHandicap(tripId: ID!, handicap: Float!): Trip
  }
`;
