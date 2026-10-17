import { pool } from './database';

export interface TaskRecord {
    id: string;
    titulo: string;
    descripcion: string | null;
    fecha_vencimiento: Date | null;
    estado: 'pendiente' | 'en curso' | 'completada';
    creado_en: Date;
    actualizado_en: Date;
}

export interface CreateTaskData {
    titulo: string;
    descripcion?: string | null | undefined;
    fecha_vencimiento?: string | null | undefined;
    estado: 'pendiente' | 'en curso' | 'completada';
}

export interface UpdateTaskData {
    titulo?: string | undefined;
    descripcion?: string | null | undefined;
    fecha_vencimiento?: string | null | undefined;
    estado?: 'pendiente' | 'en curso' | 'completada' | undefined;
}

const TASK_COLUMNS = `
    id, titulo, descripcion, fecha_vencimiento, estado, creado_en, actualizado_en
`;

/** Lista las tareas filtradas por el ID del propietario autenticado. */
export async function listTasksByUser(userId: string): Promise<TaskRecord[]> {
    const result = await pool.query<TaskRecord>(
        `SELECT ${TASK_COLUMNS}
         FROM tareas
         WHERE usuario_id = $1
         ORDER BY creado_en DESC, id DESC`,
        [userId],
    );

    return result.rows;
}

/** Busca por ID y propietario; devuelve null si falta o pertenece a otro usuario. */
export async function findTaskByIdForUser(
    taskId: string,
    userId: string,
): Promise<TaskRecord | null> {
    const result = await pool.query<TaskRecord>(
        `SELECT ${TASK_COLUMNS}
         FROM tareas
         WHERE id = $1 AND usuario_id = $2`,
        [taskId, userId],
    );

    return result.rows[0] ?? null;
}

/** Crea la tarea para el propietario proporcionado por el servicio autenticado. */
export async function createTaskForUser(
    userId: string,
    task: CreateTaskData,
): Promise<TaskRecord> {
    const result = await pool.query<TaskRecord>(
        `INSERT INTO tareas (
             usuario_id, titulo, descripcion, fecha_vencimiento, estado
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${TASK_COLUMNS}`,
        [
            userId,
            task.titulo,
            task.descripcion ?? null,
            task.fecha_vencimiento ?? null,
            task.estado,
        ],
    );

    const createdTask = result.rows[0];
    if (!createdTask) {
        throw new Error('La inserción de tarea no devolvió una fila.');
    }

    return createdTask;
}

/** Actualiza solo la combinación de tarea y propietario; en otro caso, devuelve null. */
export async function updateTaskForUser(
    taskId: string,
    userId: string,
    task: UpdateTaskData,
): Promise<TaskRecord | null> {
    const values: unknown[] = [taskId, userId];
    const assignments: string[] = [];

    if (task.titulo !== undefined) {
        values.push(task.titulo);
        assignments.push(`titulo = $${values.length}`);
    }
    if (task.descripcion !== undefined) {
        values.push(task.descripcion);
        assignments.push(`descripcion = $${values.length}`);
    }
    if (task.fecha_vencimiento !== undefined) {
        values.push(task.fecha_vencimiento);
        assignments.push(`fecha_vencimiento = $${values.length}`);
    }
    if (task.estado !== undefined) {
        values.push(task.estado);
        assignments.push(`estado = $${values.length}`);
    }

    const result = await pool.query<TaskRecord>(
        `UPDATE tareas
         SET ${assignments.join(', ')}, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $1 AND usuario_id = $2
         RETURNING ${TASK_COLUMNS}`,
        values,
    );

    return result.rows[0] ?? null;
}

/** Elimina solo la combinación de tarea y propietario indicada. */
export async function deleteTaskForUser(
    taskId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query<{ id: string }>(
        'DELETE FROM tareas WHERE id = $1 AND usuario_id = $2 RETURNING id',
        [taskId, userId],
    );

    return result.rowCount === 1;
}
