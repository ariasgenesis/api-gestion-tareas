import { rateLimit } from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: {
            mensaje: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.',
        },
    },
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});
