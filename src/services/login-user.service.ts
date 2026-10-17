import bcrypt from 'bcryptjs';
import { InvalidCredentialsError } from '../errors/app-error';
import { findUserByEmail } from '../persistence/user.repository';
import type { LoginUserInput } from './login-user.schema';
import { createAccessToken } from './jwt.service';

export async function loginUser(input: LoginUserInput) {
    const user = await findUserByEmail(input.correo);

    if (!user || !(await bcrypt.compare(input.contrasena, user.hash_contrasena))) {
        throw new InvalidCredentialsError();
    }

    const publicUser = {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        creado_en: user.creado_en,
    };

    return {
        token: createAccessToken(user.id),
        user: publicUser,
    };
}
