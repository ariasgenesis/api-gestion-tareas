import { z } from 'zod';

const taskTitle = z
    .string({ error: 'El título es obligatorio y debe ser texto.' })
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(200, 'El título no puede superar los 200 caracteres.');

const taskDescription = z
    .string({ error: 'La descripción debe ser texto.' })
    .max(10_000, 'La descripción no puede superar los 10.000 caracteres.')
    .nullable();

const taskDueDate = z
    .iso.datetime({
        offset: true,
        error: 'La fecha de vencimiento debe ser una fecha ISO 8601 con zona horaria.',
    })
    .nullable();

const taskStatus = z.enum(['pendiente', 'en curso', 'completada'], {
    error: 'El estado debe ser pendiente, en curso o completada.',
});

export const createTaskSchema = z.object({
    titulo: taskTitle,
    descripcion: taskDescription.optional(),
    fecha_vencimiento: taskDueDate.optional(),
    estado: taskStatus.optional().default('pendiente'),
});

export const updateTaskSchema = z
    .object({
        titulo: taskTitle.optional(),
        descripcion: taskDescription.optional(),
        fecha_vencimiento: taskDueDate.optional(),
        estado: taskStatus.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Debes enviar al menos un campo para actualizar.',
    });

const MAX_BIGINT = 9_223_372_036_854_775_807n;

export const taskIdSchema = z
    .string()
    .regex(/^[1-9]\d{0,18}$/, 'El identificador de tarea no es válido.')
    .refine((value) => /^\d{1,19}$/.test(value) && BigInt(value) <= MAX_BIGINT, {
        message: 'El identificador de tarea no es válido.',
    });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
