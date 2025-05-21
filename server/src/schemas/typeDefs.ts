const typeDefs = `
  type Profile {
    _id: ID
    name: String
    email: String
    password: String
    skills: [String]
    trips: [Trip]
  }

  type Auth {
    token: ID!
    profile: Profile
  }

  type Course {
    _id: ID
    name: String
  }

  type Trip {
    _id: ID
    name: String
    courses: [Course]
  }

  input ProfileInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    # Profile/User Queries
    profiles: [Profile]
    profile(profileId: ID!): Profile
    me: Profile

    # Trip Queries
    trips: [Trip]
    trip(id: ID!): Trip
  }

  type Mutation {
    # Auth/User Management
    addProfile(input: ProfileInput!): Auth
    login(email: String!, password: String!): Auth

    # Trip Management
    addTrip(name: String!): Trip
    addCourseToTrip(tripId: ID!, courseName: String!): Trip
    removeCourseFromTrip(courseName: String!): Trip

    # Optional Skills
    addSkill(profileId: ID!, skill: String!): Profile
    removeSkill(skill: String!): Profile
  }
`;

export default typeDefs;
