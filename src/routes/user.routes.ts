import { Router } from 'express';
import {
    getMyProfile,
    updateMyProfile,
    getUserAppointments,
    cancelMyAppointment
} from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// All user routes are protected by default
router.use(authenticateToken);

// Profile routes
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

// Appointment routes
router.get('/appointments', getUserAppointments);
router.put('/appointments/:appointmentId/cancel', cancelMyAppointment);

export default router;