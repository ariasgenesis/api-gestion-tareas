
import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './api/auth.routes';
import docsRouter from './api/docs.routes';
import taskRouter from './api/task.routes';
import { env } from './config/env';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { httpsOnlyInProduction } from './middleware/https-only';

const app: Application = express();
app.set('trust proxy', env.trustProxyHops);

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: env.cors.origins }));
app.use(httpsOnlyInProduction);
app.use(express.json({ limit: '64kb' }));

app.use('/auth', authRouter);
app.use('/tasks', taskRouter);
app.use('/docs', docsRouter);

// Ruta raíz: información básica de la API
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        mensaje: 'API de Gestión de Tareas funcionando correctamente.',
    });
});

// Comprobación de disponibilidad de la API
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        estado: 'correcto',
        mensaje: 'La API está funcionando correctamente.',
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
