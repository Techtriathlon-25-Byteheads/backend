import { Router } from 'express';
import { signup, login, verifyOtp } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

export default router;
