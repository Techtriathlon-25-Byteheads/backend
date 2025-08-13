import { Router } from 'express';
import { createService, deleteService, getAllServices, getServiceById, updateService } from '../controllers/service.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', authenticateToken, authorizeRole(['SUPER_ADMIN']), createService);
router.put('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), updateService);
router.delete('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), deleteService);

export default router;
