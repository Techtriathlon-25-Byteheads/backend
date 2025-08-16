
import { PrismaClient, Role, Feedback } from '@prisma/client';
import { AppError } from '../utils/error.util';

const prisma = new PrismaClient();

export class FeedbackService {
  public async createFeedback(data: { appointmentId: string; rating: number; remarks?: string; }, userId: string) {
    const appointment = await prisma.factAppointments.findUnique({
      where: { appointmentId: data.appointmentId },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('Feedback can only be given for completed appointments', 400);
    }

    if (appointment.userId !== userId) {
        throw new AppError('You are not authorized to give feedback for this appointment', 403);
    }

    const existingFeedback = await prisma.feedback.findUnique({
        where: { appointmentId: data.appointmentId },
    });

    if (existingFeedback) {
        throw new AppError('Feedback has already been submitted for this appointment', 400);
    }

    return prisma.feedback.create({
      data: {
        appointmentId: data.appointmentId,
        rating: data.rating,
        remarks: data.remarks,
      },
    });
  }

  public async getFeedbacks(user: { role: string; userId: string }) {
    if (user.role === 'SUPER_ADMIN') {
      return prisma.feedback.findMany();
    } else if (user.role === 'ADMIN') {
      const adminServices = await prisma.adminServiceAssignment.findMany({
        where: { adminId: user.userId },
        select: { serviceId: true },
      });

      const serviceIds = adminServices.map((s) => s.serviceId);

      return prisma.feedback.findMany({
        where: {
          appointment: {
            serviceId: {
              in: serviceIds,
            },
          },
        },
      });
    } else {
        return []
    }
  }

  public async getFeedbackStats(user: { role: string; userId: string }) {
    let feedbacks: Feedback[];
    if (user.role === 'SUPER_ADMIN') {
        feedbacks = await prisma.feedback.findMany();
    } else if (user.role === 'ADMIN') {
        const adminServices = await prisma.adminServiceAssignment.findMany({
            where: { adminId: user.userId },
            select: { serviceId: true },
        });
        const serviceIds = adminServices.map((s) => s.serviceId);
        feedbacks = await prisma.feedback.findMany({
            where: {
                appointment: {
                    serviceId: {
                        in: serviceIds,
                    },
                },
            },
        });
    } else {
        feedbacks = []
    }

    const totalFeedback = feedbacks.length;
    if (totalFeedback === 0) {
        return {
            totalFeedback: 0,
            averageRating: 0,
            responseRate: 0,
            positiveFeedback: 0,
            positive: 0,
            neutral: 0,
            negative: 0,
        }
    }

    const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRating / totalFeedback;

    const completedAppointments = await prisma.factAppointments.count({
        where: { status: 'completed' },
    });

    const responseRate = (totalFeedback / completedAppointments) * 100;

    const positive = feedbacks.filter((f) => f.rating > 3).length;
    const neutral = feedbacks.filter((f) => f.rating === 3).length;
    const negative = feedbacks.filter((f) => f.rating < 3).length;

    const positiveFeedback = (positive / totalFeedback) * 100;

    return {
      totalFeedback,
      averageRating,
      responseRate,
      positiveFeedback,
      positive,
      neutral,
      negative,
    };
  }
}
