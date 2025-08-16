import { Router } from 'express';
import { signup, login, verifyOtp, validateToken } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/validate', validateToken);

export default router;
