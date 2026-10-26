// server/src/models/index.ts

import Profile from './Profile.js';
import Trip from './Trip.js';
import Invite from './Invite.js';

/**
 * Note; Central export of active Mongoose models.
 * Explicit .js extensions keep the compiled ESM imports resolvable in Node.
 */
export { Profile, Trip, Invite };

/**
 * Create the safety-critical indexes declared by the schemas without dropping
 * any existing production indexes. Server startup awaits this so Guest Demo
 * cannot begin accepting temporary data before TTL cleanup and invite
 * uniqueness are ready.
 */
export const initializeModelIndexes = async (): Promise<void> => {
  await Promise.all([
    Profile.createIndexes(),
    Trip.createIndexes(),
    Invite.createIndexes(),
  ]);
};
