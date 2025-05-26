// server/src/schemas/typeDefs.ts

/**
 * GraphQL schema (SDL) as a plain string.
 * Apollo Server accepts string typeDefs directly, so no need for `gql` here.
 */
const typeDefs = `
  # --------- Profile & Authentication Types --------- #

  type Profile {
    _id: ID
    name: String
    email: String
    password: String
    trips: [Trip]
  }

  type Auth {
    token: ID!
    profile: Profile
  }

  # --------- Trip & Course Types --------- #

  type Course {
    _id: ID
    name: String
    address: String
    location: Location
  }

  type Location {
    lat: Float
    lng: Float
  }

  type Score {
    hole: Int
    score: Int
  }

  type Player {
    name: String
    scores: [Score]
  }

  type Trip {
    _id: ID
    name: String
    date: String
    courses: [Course]
    players: [Player]
  }

  # --------- Input Types --------- #

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

  # --------- Query Definitions --------- #

  type Query {
    me: Profile
    profiles: [Profile]
    profile(profileId: ID!): Profile
    trips: [Trip]
    trip(id: ID!): Trip
  }

  # --------- Mutation Definitions --------- #

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
  }
`;

export default typeDefs;
