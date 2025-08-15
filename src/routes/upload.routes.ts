import { Router } from 'express';
import { uploadDocument } from '../controllers/upload.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// All routes in this file are protected
router.post('/upload', authenticateToken, uploadDocument);

export default router;
