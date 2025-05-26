// server/src/schemas/index.ts

import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';

/**
 * Combined GraphQL schema for Apollo Server
 *
 * - typeDefs: GraphQL SDL string
 * - resolvers: Resolver map implementing the schema's behavior
 */
export const schema = {
  typeDefs,
  resolvers,
};

// Also export individually if needed elsewhere
export { typeDefs, resolvers };
