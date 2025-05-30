// server/utils/auth.ts
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
const SECRET = process.env.JWT_SECRET_KEY || '';
/**
 * Attach req.user and—if the token was expired—issue a fresh 8-hour JWT
 * via the `x-access-token` response header.
 */
export const authenticateToken = ({ req, res, }) => {
    let token = req.body?.token
        || req.query?.token
        || req.headers.authorization;
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }
    if (!token)
        return req;
    try {
        const { data } = jwt.verify(token, SECRET);
        req.user = data;
    }
    catch (err) {
        console.warn('Token verification failed:', err);
        if (err instanceof jwt.TokenExpiredError) {
            // decode without verifying signature to get payload
            const decoded = jwt.decode(token);
            if (decoded?.data) {
                req.user = decoded.data;
                // issue a fresh 8-hour token
                const fresh = signToken(decoded.data.username, decoded.data.email, decoded.data._id);
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
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
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
