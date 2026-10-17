import type { Request, Response } from 'express';
import {
    AuthenticationRequiredError,
    ValidationError,
} from '../errors/app-error';
import {
    createTaskSchema,
    taskIdSchema,
    updateTaskSchema,
} from '../services/task.schema';
import {
    createTask,
    deleteTask,
    getTask,
    listTasks,
    updateTask,
} from '../services/task.service';

export async function list(req: Request, res: Response): Promise<void> {
    const tasks = await listTasks(getAuthenticatedUserId(req));
    res.status(200).json({ tareas: tasks });
}

export async function getById(req: Request, res: Response): Promise<void> {
    const taskId = parseTaskId(req.params.id);
    const task = await getTask(taskId, getAuthenticatedUserId(req));
    res.status(200).json({ tarea: task });
}

export async function create(req: Request, res: Response): Promise<void> {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ValidationError(
            'Los datos de la tarea no son válidos.',
            parsed.error.issues.map(({ path, message }) => ({
                campo: path.join('.'),
                mensaje: message,
            })),
        );
    }

    const task = await createTask(getAuthenticatedUserId(req), parsed.data);
    res.status(201).json({ mensaje: 'Tarea creada correctamente.', tarea: task });
}

export async function update(req: Request, res: Response): Promise<void> {
    const taskId = parseTaskId(req.params.id);
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ValidationError(
            'Los datos de la tarea no son válidos.',
            parsed.error.issues.map(({ path, message }) => ({
                campo: path.join('.'),
                mensaje: message,
            })),
        );
    }

    const task = await updateTask(
        taskId,
        getAuthenticatedUserId(req),
        parsed.data,
    );
    res.status(200).json({ mensaje: 'Tarea actualizada correctamente.', tarea: task });
}

export async function destroy(req: Request, res: Response): Promise<void> {
    const taskId = parseTaskId(req.params.id);
    await deleteTask(taskId, getAuthenticatedUserId(req));
    res.status(200).json({ mensaje: 'Tarea eliminada correctamente.' });
}

function getAuthenticatedUserId(req: Request): string {
    if (!req.auth?.userId) throw new AuthenticationRequiredError();
    return req.auth.userId;
}

function parseTaskId(value: unknown): string {
    const parsed = taskIdSchema.safeParse(value);
    if (!parsed.success) {
        throw new ValidationError('El identificador de tarea no es válido.');
    }
    return parsed.data;
}
