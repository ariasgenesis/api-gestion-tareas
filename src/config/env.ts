import 'dotenv/config';

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(
            `Falta una variable de entorno obligatoria: ${name}`,
        );
    }

    return value;
}

function getPort(name: string, defaultValue: number): number {
    const rawValue = process.env[name];

    if (!rawValue) {
        return defaultValue;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`Puerto no válido configurado en ${name}`);
    }

    return value;
}

function getBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];

    if (value === undefined) {
        return defaultValue;
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    throw new Error(`${name} must be true or false`);
}

export const env = Object.freeze({
    port: getPort('PORT', 3000),

    database: Object.freeze({
        host: getRequiredEnv('DB_HOST'),
        port: getPort('DB_PORT', 5432),
        name: getRequiredEnv('DB_NAME'),
        user: getRequiredEnv('DB_USER'),
        password: getRequiredEnv('DB_PASSWORD'),
        ssl: getBoolean('DB_SSL', false),
    }),
});
