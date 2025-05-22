// src/schema/typeDefs.ts

// Note; GraphQL schema definitions for Fairway Finder

const typeDefs = `
  # --------- Profile & Authentication Types --------- #

  type Profile {
    _id: ID
    name: String
    email: String
    password: String
    skills: [String]
    trips: [Trip]
  }

  type Auth {
    token: ID!      # Note; JWT token for authenticated sessions
    profile: Profile
  }

  # --------- Course & Trip Types --------- #

  type Course {
    _id: ID
    name: String
  }

  type Trip {
    _id: ID
    name: String
    courses: [Course]
  }

  # --------- Input Types --------- #

  input ProfileInput {
    name: String!   # Note; Username for registration
    email: String!  # Note; Email for login/notifications
    password: String! # Note; Password for authentication
  }

  # --------- Query Definitions --------- #

  type Query {
    # Profile/User Queries
    profiles: [Profile]           # Note; Fetch all user profiles
    profile(profileId: ID!): Profile  # Note; Fetch single profile by ID
    me: Profile                  # Note; Fetch current authenticated user

    # Trip Queries
    trips: [Trip]               # Note; Fetch all trips
    trip(id: ID!): Trip         # Note; Fetch a single trip by ID
  }

  # --------- Mutation Definitions --------- #

  type Mutation {
    # Auth/User Management
    addProfile(input: ProfileInput!): Auth   # Note; Register new user and return Auth payload
    login(email: String!, password: String!): Auth  # Note; Log in and return Auth payload

    # Trip Management
    addTrip(name: String!): Trip                     # Note; Create a new trip
    addCourseToTrip(tripId: ID!, courseName: String!): Trip  # Note; Add course to a trip
    removeCourseFromTrip(courseName: String!): Trip          # Note; Remove course from a trip

    # Optional Skills Management
    addSkill(profileId: ID!, skill: String!): Profile  # Note; Add skill to user profile
    removeSkill(skill: String!): Profile              # Note; Remove skill from user profile
  }
`;

export default typeDefs;
