// server/utils/auth.ts

import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

interface UserPayload {
  username: string;
  email: string;
  _id: string;
}

const SECRET = process.env.JWT_SECRET_KEY || '';

/**
 * Extend Express’s Request type so `req.user` and `req.newToken` exist.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
    newToken?: string;
  }
}

/**
 * Attach req.user and—if the token was expired—issue a fresh 8-hour JWT
 * via the `x-access-token` response header.
 */
export const authenticateToken = ({
  req,
  res,
}: {
  req: express.Request;
  res?: express.Response;
}) => {
  let token = req.body?.token
    || req.query?.token
    || req.headers.authorization;

  if (typeof token === 'string' && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }
  if (!token) return req;

  try {
    const { data } = jwt.verify(token, SECRET) as { data: UserPayload };
    req.user = data;
  } catch (err: any) {
    console.warn('Token verification failed:', err);

    if (err instanceof (jwt as any).TokenExpiredError) {
      // decode without verifying signature to get payload
      const decoded = jwt.decode(token) as { data?: UserPayload } | null;
      if (decoded?.data) {
        req.user = decoded.data;

        // issue a fresh 8-hour token
        const fresh = signToken(
          decoded.data.username,
          decoded.data.email,
          decoded.data._id
        );
        if (res && !res.headersSent) {
          res.setHeader('x-access-token', fresh);
        }
      }
    }
    // otherwise leave req.user undefined
  }

  return req;
};

/**
 * Sign a JWT carrying { data: UserPayload } that expires in 8 hours.
 */
export const signToken = (
  username: string,
  email: string,
  _id: string
): string => {
  const payload: UserPayload = { username, email, _id };
  return jwt.sign({ data: payload }, SECRET, {
    expiresIn: '8h',
  });
};

/**
 * GraphQL error to throw when auth is missing/invalid.
 */
export class AuthenticationError extends GraphQLError {
  constructor(message = 'You must be logged in.') {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}
