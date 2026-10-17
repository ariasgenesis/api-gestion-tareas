import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                mensaje: error.message,
                ...(error.details ? { detalles: error.details } : {}),
            },
        });
        return;
    }

    if (isRequestBodyError(error)) {
        if (error.type === 'entity.parse.failed') {
            res.status(400).json({
                error: { mensaje: 'El cuerpo de la solicitud no contiene JSON válido.' },
            });
            return;
        }

        if (error.type === 'entity.too.large') {
            res.status(413).json({
                error: { mensaje: 'El cuerpo de la solicitud supera el tamaño permitido.' },
            });
            return;
        }
    }

    // No registrar el objeto de error de una petición, que podría incluir datos sensibles.
    console.error('Error inesperado al procesar la solicitud.');
    res.status(500).json({
        error: { mensaje: 'Ocurrió un error interno. Inténtalo más tarde.' },
    });
};

function isRequestBodyError(
    error: unknown,
): error is Error & { type: string } {
    return (
        error instanceof Error &&
        'type' in error &&
        typeof (error as Error & { type?: unknown }).type === 'string'
    );
}
