import bcrypt from 'bcryptjs';
import { findUserByEmail, insertUser } from '../persistence/user.repository';
import type { RegisterUserInput } from './register-user.schema';
import { EmailAlreadyExistsError } from '../errors/app-error';

const BCRYPT_COST = 12;

export async function registerUser(input: RegisterUserInput) {
    const existingUser = await findUserByEmail(input.correo);
    if (existingUser) {
        throw new EmailAlreadyExistsError();
    }

    const passwordHash = await bcrypt.hash(input.contrasena, BCRYPT_COST);

    // La restricción única en PostgreSQL sigue siendo la autoridad ante carreras.
    return insertUser({
        nombre: input.nombre,
        correo: input.correo,
        passwordHash,
    });
}
