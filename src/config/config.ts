import { env } from './env';

// Alias de compatibilidad para consumidores que aún usan los nombres anteriores.
export const config = Object.freeze({
    PORT: env.port,
    DB_HOST: env.database.host,
    DB_PORT: env.database.port,
    DB_USER: env.database.user,
    DB_PASSWORD: env.database.password,
    DB_NAME: env.database.name,
    JWT_SECRET: env.jwt.secret,
});
