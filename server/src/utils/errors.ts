// server/src/utils/errors.ts

import { GraphQLError } from 'graphql';

/**
 * Note; Input the caller can fix. The client reads extensions.code; invalidArgs names the field.
 */
export class UserInputError extends GraphQLError {
  constructor(message: string, extensions: Record<string, unknown> = {}) {
    super(message, { extensions: { ...extensions, code: 'BAD_USER_INPUT' } });
    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}
