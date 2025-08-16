
import { Response } from 'express';
import { FeedbackService } from '../services/feedback.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class FeedbackController {
  private feedbackService = new FeedbackService();

  public createFeedback = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const feedback = await this.feedbackService.createFeedback(req.body, req.user.userId);
      res.status(201).json(feedback);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  public getFeedbacks = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const feedbacks = await this.feedbackService.getFeedbacks(req.user);
      res.status(200).json(feedbacks);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  public getFeedbackStats = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const stats = await this.feedbackService.getFeedbackStats(req.user);
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
