import { ResourceNotFoundError } from '../errors/app-error';
import {
    createTaskForUser,
    deleteTaskForUser,
    findTaskByIdForUser,
    listTasksByUser,
    updateTaskForUser,
    type CreateTaskData,
    type UpdateTaskData,
} from '../persistence/task.repository';

export function listTasks(userId: string) {
    return listTasksByUser(userId);
}

export async function getTask(taskId: string, userId: string) {
    const task = await findTaskByIdForUser(taskId, userId);
    if (!task) throw new ResourceNotFoundError('La tarea solicitada no existe.');
    return task;
}

export function createTask(userId: string, task: CreateTaskData) {
    return createTaskForUser(userId, task);
}

export async function updateTask(
    taskId: string,
    userId: string,
    task: UpdateTaskData,
) {
    const updatedTask = await updateTaskForUser(taskId, userId, task);
    if (!updatedTask) {
        throw new ResourceNotFoundError('La tarea solicitada no existe.');
    }
    return updatedTask;
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
    const deleted = await deleteTaskForUser(taskId, userId);
    if (!deleted) throw new ResourceNotFoundError('La tarea solicitada no existe.');
}
