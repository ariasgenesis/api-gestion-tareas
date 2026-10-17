import app from './app';
import { env } from './config/env';
import {
    checkDatabaseConnection,
    pool,
} from './persistence/database';

async function startServer(): Promise<void> {
    try {
        // Verifica la conexión antes de aceptar solicitudes.
        await checkDatabaseConnection();

        const server = app.listen(env.port, () => {
            console.log(
                `Servidor iniciado en http://localhost:${env.port}`,
            );
        });

        let shuttingDown = false;

        async function shutdown(signal: string): Promise<void> {
            if (shuttingDown) return;
            shuttingDown = true;

            console.log(`Señal ${signal} recibida. Cerrando servidor...`);

            try {
                await new Promise<void>((resolve, reject) => {
                    server.close((error: Error | undefined) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });

                await pool.end();

                console.log('Servidor y conexiones cerrados correctamente.');
            } catch (error) {
                console.error('Error al cerrar la aplicación:', error);
                process.exitCode = 1;
            }
        }

        process.once('SIGINT', () => {
            void shutdown('SIGINT');
        });

        process.once('SIGTERM', () => {
            void shutdown('SIGTERM');
        });
    } catch (error) {
        console.error(
            'No fue posible iniciar la aplicación. Verifica la configuración y la conexión a la base de datos.',
            error,
        );

        await pool.end();
        process.exitCode = 1;
    }
}

void startServer();