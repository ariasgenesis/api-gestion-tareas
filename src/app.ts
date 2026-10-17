
import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

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

export default app;
