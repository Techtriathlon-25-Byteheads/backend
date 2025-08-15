import { Router } from 'express';
import { bookAppointment, getAvailableSlots, getServicesForDepartment } from '../controllers/appointment.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:departmentId/services', getServicesForDepartment);
router.get('/:serviceId/slots', getAvailableSlots);
router.post('/', authenticateToken, authorizeRole(['CITIZEN', 'ADMIN', 'SUPER_ADMIN']), bookAppointment);


export default router;
