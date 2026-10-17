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

    throw new Error(`${name} debe ser true o false.`);
}

function getCorsOrigins(): string[] {
    const configuredValue = process.env.CORS_ORIGINS;
    if (!configuredValue && process.env.NODE_ENV === 'production') {
        throw new Error('CORS_ORIGINS es obligatoria en producción.');
    }
    const configured = configuredValue ?? 'http://localhost:5173';
    const origins = configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        throw new Error('CORS_ORIGINS debe contener al menos un origen permitido.');
    }

    for (const origin of origins) {
        let parsed: URL;
        try {
            parsed = new URL(origin);
        } catch {
            throw new Error('CORS_ORIGINS contiene un origen no válido.');
        }

        if (
            !['http:', 'https:'].includes(parsed.protocol) ||
            parsed.origin !== origin
        ) {
            throw new Error(
                'Cada valor de CORS_ORIGINS debe ser un origen HTTP o HTTPS sin ruta.',
            );
        }
    }

    return origins;
}

function getTrustProxyHops(): number {
    const rawValue = process.env.TRUST_PROXY_HOPS;
    if (rawValue === undefined || rawValue === '') return 0;

    const hops = Number(rawValue);
    if (!Number.isInteger(hops) || hops < 0 || hops > 10) {
        throw new Error('TRUST_PROXY_HOPS debe ser un entero entre 0 y 10.');
    }

    return hops;
}

function getJwtSecret(): string {
    const secret = getRequiredEnv('JWT_SECRET');

    if (Buffer.byteLength(secret, 'utf8') < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 bytes.');
    }

    return secret;
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

    jwt: Object.freeze({
        secret: getJwtSecret(),
    }),

    cors: Object.freeze({
        origins: getCorsOrigins(),
    }),

    trustProxyHops: getTrustProxyHops(),
});
