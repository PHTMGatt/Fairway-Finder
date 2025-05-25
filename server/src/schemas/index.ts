// server/src/schemas/index.ts

import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';

// 🔗 Export as Apollo schema
export const schema = {
  typeDefs,
  resolvers,
};

// Also export separately if needed elsewhere
export { typeDefs, resolvers };
