import jwt, { JwtPayload } from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();

// Define a type-safe user payload structure
interface UserPayload {
  username: string;
  email: string;
  _id: string;
}

// Context enhancer to extract user from token
export const authenticateToken = ({ req }: { req: any }) => {
  let token = req.body?.token || req.query?.token || req.headers?.authorization;

  // Extract token if "Bearer <token>" format
  if (req.headers?.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req; // No token, allow unauthenticated access if route permits
  }

try {
  const secret = process.env.JWT_SECRET_KEY || '';
  const { data }: any = jwt.verify(token, secret, { maxAge: '2h' }) as { data: UserPayload };
  req.user = data;
} catch (err) {
  console.warn('Token verification failed:', err);
}

  return req;
};

// Generate a signed JWT
export const signToken = (username: string, email: string, _id: string) => {
  const payload: UserPayload = { username, email, _id };
  const secret = process.env.JWT_SECRET_KEY || '';

  return jwt.sign({ data: payload }, secret, { expiresIn: '2h' });
};

// Custom GraphQL error for auth failures
export class AuthenticationError extends GraphQLError {
  constructor(message = 'You must be logged in.') {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}
