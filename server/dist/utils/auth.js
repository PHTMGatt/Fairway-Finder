import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
// Note; Middleware for GraphQL context to extract and verify JWT from request
export const authenticateToken = ({ req }) => {
    // Note; Try to get token from body, query, or headers
    let token = req.body?.token || req.query?.token || req.headers?.authorization;
    // Note; If header is of form "Bearer <token>", extract the token part
    if (req.headers?.authorization) {
        token = token.split(' ').pop()?.trim();
    }
    // Note; If no token, return request as-is (unauthenticated)
    if (!token) {
        return req;
    }
    try {
        // Note; Verify token using JWT_SECRET_KEY, enforce max age
        const secret = process.env.JWT_SECRET_KEY || '';
        const { data } = jwt.verify(token, secret, { maxAge: '2h' });
        // Note; Attach decoded user payload to request
        req.user = data;
    }
    catch (err) {
        // Note; Log verification failures (token expired or invalid)
        console.warn('Token verification failed:', err);
    }
    return req;
};
// Note; Utility to sign a JWT for a given user payload
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secret = process.env.JWT_SECRET_KEY || '';
    // Note; Return signed token with 'data' field and 2-hour expiry
    return jwt.sign({ data: payload }, secret, { expiresIn: '12h' });
};
// Note; Custom error for authentication failures in GraphQL
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
