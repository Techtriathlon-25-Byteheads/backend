import { Router } from 'express';
import { addServiceToDepartment, createDepartment, deleteDepartment, getAllDepartments, getDepartmentById, removeServiceFromDepartment, updateDepartment } from '../controllers/department.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authenticateToken, authorizeRole(['SUPER_ADMIN']), createDepartment);
router.put('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), updateDepartment);
router.delete('/:id', authenticateToken, authorizeRole(['SUPER_ADMIN']), deleteDepartment);

router.post('/:departmentId/services/:serviceId', authenticateToken, authorizeRole(['SUPER_ADMIN']), addServiceToDepartment);
router.delete('/:departmentId/services/:serviceId', authenticateToken, authorizeRole(['SUPER_ADMIN']), removeServiceFromDepartment);

export default router;
