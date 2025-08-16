
import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const feedbackController = new FeedbackController();

router.post('/feedback', authenticateToken, feedbackController.createFeedback);
router.get('/feedback', authenticateToken, feedbackController.getFeedbacks);
router.get('/feedback/stats', authenticateToken, feedbackController.getFeedbackStats);

export default router;
