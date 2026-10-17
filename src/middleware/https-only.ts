import type { RequestHandler } from 'express';

export const httpsOnlyInProduction: RequestHandler = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production' || req.secure || req.path === '/health') {
        next();
        return;
    }

    res.status(426).json({
        error: { mensaje: 'Esta API requiere una conexión HTTPS.' },
    });
};
