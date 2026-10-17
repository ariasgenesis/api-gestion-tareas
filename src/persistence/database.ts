
import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    ssl: env.database.ssl ? { rejectUnauthorized: true } : false,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
});

export async function checkDatabaseConnection(): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query('SELECT 1');
        console.log('PostgreSQL connection established successfully.');
    } finally {
        client.release();
    }
}
