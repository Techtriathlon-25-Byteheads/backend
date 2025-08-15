import { Router } from 'express';
import {
    login,
    getAdminAppointments,
    createAdminAppointment,
    updateAppointmentStatus,
    deleteAdminAppointment,
    updateDocumentStatus,
    createAdmin,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getAllUsers,
    updateUser
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Public route for admin login
router.post('/login', login);

// All subsequent routes are protected
router.use(authenticateToken);

// Routes for appointment management (for both ADMIN and SUPER_ADMIN)
// Authorization is handled inside the controller based on role
router.get('/appointments', getAdminAppointments);
router.post('/appointments', createAdminAppointment);
router.put('/appointments/:appointmentId', updateAppointmentStatus);
router.delete('/appointments/:appointmentId', deleteAdminAppointment);

// Route for document status update
router.put('/documents/:documentId', authorizeRole(['ADMIN', 'SUPER_ADMIN']), updateDocumentStatus);

// Routes for super admins only
router.get('/admins', authorizeRole(['SUPER_ADMIN']), getAllAdmins);
router.post('/admins', authorizeRole(['SUPER_ADMIN']), createAdmin);
router.put('/admins/:userId', authorizeRole(['SUPER_ADMIN']), updateAdmin);
router.delete('/admins/:userId', authorizeRole(['SUPER_ADMIN']), deleteAdmin);

router.get('/users', authorizeRole(['SUPER_ADMIN']), getAllUsers);
router.put('/users/:userId', authorizeRole(['SUPER_ADMIN']), updateUser);

export default router;
