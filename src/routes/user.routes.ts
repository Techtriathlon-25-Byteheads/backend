import { Router } from 'express';
import { getMyApointments, getMyDocuments } from '../controllers/user.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/appointments', authenticateToken, authorizeRole(['CITIZEN']), getMyApointments);
router.get('/documents', authenticateToken, authorizeRole(['CITIZEN']), getMyDocuments);

export default router;
