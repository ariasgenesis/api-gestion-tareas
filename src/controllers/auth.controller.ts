import type { Request, Response } from 'express';
import { registerUserSchema } from '../services/register-user.schema';
import { registerUser } from '../services/register-user.service';
import { loginUserSchema } from '../services/login-user.schema';
import { loginUser } from '../services/login-user.service';
import { ACCESS_TOKEN_TTL_SECONDS } from '../services/jwt.service';
import { ValidationError } from '../errors/app-error';

/** Atiende `POST /auth/register` y devuelve únicamente campos públicos. */
export async function register(req: Request, res: Response): Promise<void> {
    const parsed = registerUserSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            'Los datos enviados no son válidos.',
            parsed.error.issues.map(({ path, message }) => ({
                campo: path.join('.'),
                mensaje: message,
            })),
        );
    }

    const user = await registerUser(parsed.data);

    res.status(201).json({
        mensaje: 'Usuario registrado correctamente.',
        usuario: user,
    });
}

/** Atiende `POST /auth/login` y devuelve un token Bearer de corta duración. */
export async function login(req: Request, res: Response): Promise<void> {
    const parsed = loginUserSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            'Los datos enviados no son válidos.',
            parsed.error.issues.map(({ path, message }) => ({
                campo: path.join('.'),
                mensaje: message,
            })),
        );
    }

    const result = await loginUser(parsed.data);

    res.status(200).json({
        mensaje: 'Inicio de sesión exitoso.',
        token: result.token,
        tipo_token: 'Bearer',
        expira_en: ACCESS_TOKEN_TTL_SECONDS,
        usuario: result.user,
    });
}
