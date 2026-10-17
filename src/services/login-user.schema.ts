import { z } from 'zod';
import { normalizedEmailSchema } from './register-user.schema';

export const loginUserSchema = z.object({
    correo: normalizedEmailSchema,
    contrasena: z
        .string({ error: 'La contraseña es obligatoria y debe ser texto.' })
        .min(1, 'La contraseña es obligatoria.')
        .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
            message: 'La contraseña no puede superar los 72 bytes.',
        }),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;
