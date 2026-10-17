import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/config';

const app: Application = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API de Gestión de Tareas funcionando correctamente (っ˘ω˘ς)' });
});

// Iniciar servidor usando el puerto del Singleton
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`Servidor corriendo exitosamente en el puerto ${PORT}`);
});