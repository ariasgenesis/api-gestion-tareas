import { pool } from './database';
import { EmailAlreadyExistsError } from '../errors/app-error';

export interface PublicUser {
    id: string;
    nombre: string;
    correo: string;
    creado_en: Date;
}

interface CreateUser {
    nombre: string;
    correo: string;
    passwordHash: string;
}

export interface UserForAuthentication extends PublicUser {
    hash_contrasena: string;
}

export async function findUserByEmail(
    correo: string,
): Promise<UserForAuthentication | null> {
    const result = await pool.query<UserForAuthentication>(
        `SELECT id, nombre, correo, hash_contrasena, creado_en
         FROM usuarios
         WHERE LOWER(correo) = $1
         LIMIT 1`,
        [correo],
    );

    return result.rows[0] ?? null;
}

export async function insertUser(user: CreateUser): Promise<PublicUser> {
    try {
        const result = await pool.query<PublicUser>(
            `INSERT INTO usuarios (nombre, correo, hash_contrasena)
             VALUES ($1, $2, $3)
             RETURNING id, nombre, correo, creado_en`,
            [user.nombre, user.correo, user.passwordHash],
        );

        const createdUser = result.rows[0];
        if (!createdUser) {
            throw new Error('La inserción de usuario no devolvió una fila.');
        }

        return createdUser;
    } catch (error) {
        if (
            isPostgresUniqueViolation(error) &&
            error.constraint === 'usuarios_correo_unico'
        ) {
            throw new EmailAlreadyExistsError();
        }

        throw error;
    }
}

function isPostgresUniqueViolation(
    error: unknown,
): error is Error & { code: string; constraint?: string } {
    return (
        error instanceof Error &&
        'code' in error &&
        (error as Error & { code?: unknown }).code === '23505'
    );
}
