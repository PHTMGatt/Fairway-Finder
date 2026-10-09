// server/src/utils/auth.ts

import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import express from 'express';

interface UserPayload {
  username: string;
  email: string;
  _id: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET_KEY is not configured');
  }
  return secret;
};

/**
 * Authenticate only from the standard Authorization header.
 * Expired or invalid tokens never receive access and are never silently renewed.
 */
export const authenticateToken = ({
  req,
}: {
  req: express.Request;
  res?: express.Response;
}) => {
  const authorization = req.headers.authorization;
  if (!authorization) return req;

  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : authorization.trim();

  if (!token) return req;

  try {
    const { data } = jwt.verify(token, getSecret()) as { data: UserPayload };
    req.user = data;
  } catch (err: any) {
    console.warn(`Token verification failed: ${err?.name || 'invalid token'}`);
    delete req.user;
  }

  return req;
};

export const signToken = (
  username: string,
  email: string,
  _id: string
): string => {
  const payload: UserPayload = { username, email, _id };
  return jwt.sign({ data: payload }, getSecret(), {
    expiresIn: '8h',
  });
};

export class AuthenticationError extends GraphQLError {
  constructor(message = 'You must be logged in.') {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}
