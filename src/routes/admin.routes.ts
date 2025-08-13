import { Router } from 'express';
import { getAppointmentsForDepartment, login, updateAppointmentStatus, updateDocumentStatus } from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/appointments', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), getAppointmentsForDepartment);
router.put('/appointments/:appointmentId', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), updateAppointmentStatus);
router.put('/documents/:documentId', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), updateDocumentStatus);

export default router;
