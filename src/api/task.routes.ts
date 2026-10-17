import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticate-token';
import {
    create,
    destroy,
    getById,
    list,
    update,
} from '../controllers/task.controller';

const taskRouter = Router();

taskRouter.use(authenticateToken);
taskRouter.get('/', list);
taskRouter.post('/', create);
taskRouter.get('/:id', getById);
taskRouter.patch('/:id', update);
taskRouter.delete('/:id', destroy);

export default taskRouter;
