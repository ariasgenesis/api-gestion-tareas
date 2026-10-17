
import { checkDatabaseConnection, pool } from './database';

async function main(): Promise<void> {
    try {
        await checkDatabaseConnection();

        const result = await pool.query<{
            database_name: string;
            current_user: string;
        }>(`
            SELECT
                current_database() AS database_name,
                current_user AS current_user
        `);

        console.log('Connection details:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void main();
