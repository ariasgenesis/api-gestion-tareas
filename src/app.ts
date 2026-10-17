import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env'; // Apuntando a tu archivo env.ts

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API de Gestión de Tareas funcionando correctamente' });
});

// Usamos env.port de tu estructura validada
const PORT = env.port;
app.listen(PORT, () => {
    console.log(`Servidor corriendo exitosamente en el puerto ${PORT}`);
});