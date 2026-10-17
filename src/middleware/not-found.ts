import type { RequestHandler } from 'express';
import { ResourceNotFoundError } from '../errors/app-error';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
    next(new ResourceNotFoundError('La ruta solicitada no existe.'));
};
