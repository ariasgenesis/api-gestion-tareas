import { Router, type RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openapi';

const docsRouter = Router();

// La excepción de scripts inline de Swagger UI se limita a la ruta /docs.
const swaggerContentSecurityPolicy: RequestHandler = (_req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    next();
};

docsRouter.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
});

docsRouter.use(swaggerContentSecurityPolicy);
docsRouter.use(...swaggerUi.serve);
docsRouter.use(
    swaggerUi.setup(openApiDocument, {
        customSiteTitle: 'Swagger UI | API de gestión de tareas',
    }),
);

export default docsRouter;
