import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';
// Note; Combine type definitions and resolvers into a single schema export
export const schema = {
    typeDefs,
    resolvers,
};
// Note; Also export typeDefs and resolvers individually for flexibility
export { typeDefs, resolvers };
