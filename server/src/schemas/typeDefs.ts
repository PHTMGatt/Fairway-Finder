const typeDefs = `
  type Profile {
    _id: ID
    name: String
    email: String
    password: String
    skills: [String]!
  }

  type Auth {
    token: ID!
    profile: Profile
  }
  
  input ProfileInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    profiles: [Profile]!
    profile(profileId: ID!): Profile
    me: Profile
  }

  type Mutation {
    addProfile(input: ProfileInput!): Auth
    login(email: String!, password: String!): Auth

    addSkill(profileId: ID!, skill: String!): Profile
    removeProfile: Profile
    removeSkill(skill: String!): Profile
  }
`;

export default typeDefs;
