import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { InvalidAccessTokenError } from '../errors/app-error';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const JWT_ALGORITHM = 'HS256' as const;
const JWT_EXPIRES_IN = '15m' as const;

export interface AccessTokenClaims {
    sub: string;
    iat: number;
    exp: number;
}

export function createAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.jwt.secret, {
        algorithm: JWT_ALGORITHM,
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
    try {
        const payload = jwt.verify(token, env.jwt.secret, {
            algorithms: [JWT_ALGORITHM],
        }) as JwtPayload;

        if (
            typeof payload.sub !== 'string' ||
            typeof payload.iat !== 'number' ||
            typeof payload.exp !== 'number'
        ) {
            throw new InvalidAccessTokenError();
        }

        return {
            sub: payload.sub,
            iat: payload.iat,
            exp: payload.exp,
        };
    } catch {
        throw new InvalidAccessTokenError();
    }
}
