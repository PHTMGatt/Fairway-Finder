// server/src/utils/auth.ts

import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import express from 'express';

interface UserPayload {
  username: string;
  email: string;
  _id: string;
  isGuest?: boolean; // Note; for the client's UI only; the server always checks the Profile record
}

// Note; How long a permanent login lasts before signing in again
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

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

/**
 * Sign a session token. It expires after SESSION_TTL_SECONDS, or at `notAfter`
 * (a guest's expiresAt) if that comes first. The expiry is an absolute time so it
 * can never outlive the guest account.
 */
export const signToken = (
  username: string,
  email: string,
  _id: string,
  { notAfter, isGuest }: { notAfter?: Date; isGuest?: boolean } = {}
): string => {
  const payload: UserPayload = { username, email, _id, ...(isGuest ? { isGuest: true } : {}) };
  const nowSeconds = Math.floor(Date.now() / 1000);
  let exp = nowSeconds + SESSION_TTL_SECONDS;
  if (notAfter) exp = Math.min(exp, Math.floor(notAfter.getTime() / 1000));
  return jwt.sign({ data: payload, exp }, getSecret());
};

export class AuthenticationError extends GraphQLError {
  constructor(message = 'You must be logged in.') {
    super(message, { extensions: { code: 'UNAUTHENTICATED' } });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}
