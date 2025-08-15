import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all analytics routes
router.use(authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/', getAnalytics);

export default router;
