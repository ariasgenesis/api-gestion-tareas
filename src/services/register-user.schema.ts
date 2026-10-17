import { z } from 'zod';

export const normalizedEmailSchema = z
    .string({ error: 'El correo es obligatorio y debe ser texto.' })
    .transform((value) => value.trim().toLowerCase())
    .pipe(
        z
            .string()
            .min(1, 'El correo es obligatorio.')
            .max(255, 'El correo no puede superar los 255 caracteres.')
            .pipe(z.email({ error: 'El formato del correo no es válido.' })),
    );

export const registerUserSchema = z.object({
    nombre: z
        .string({ error: 'El nombre es obligatorio y debe ser texto.' })
        .min(1, 'El nombre es obligatorio.')
        .max(100, 'El nombre no puede superar los 100 caracteres.')
        .refine((value) => value === value.trim(), {
            message: 'El nombre no debe tener espacios al inicio ni al final.',
        }),
    correo: normalizedEmailSchema,
    contrasena: z
        .string({ error: 'La contraseña es obligatoria y debe ser texto.' })
        .min(8, 'La contraseña debe tener al menos 8 caracteres.')
        .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
            message: 'La contraseña no puede superar los 72 bytes al cifrarse.',
        }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
