import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/login-rate-limiter';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', loginRateLimiter, login);

export default authRouter;
