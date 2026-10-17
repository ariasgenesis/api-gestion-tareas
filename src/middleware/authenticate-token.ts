import type { RequestHandler } from 'express';
import { AuthenticationRequiredError } from '../errors/app-error';
import { verifyAccessToken } from '../services/jwt.service';

/** Verifica el token Bearer y adjunta su sujeto autenticado a la solicitud. */
export const authenticateToken: RequestHandler = (req, _res, next) => {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);

    if (!match?.[1]) {
        next(new AuthenticationRequiredError());
        return;
    }

    const claims = verifyAccessToken(match[1]);
    req.auth = { userId: claims.sub };
    next();
};
