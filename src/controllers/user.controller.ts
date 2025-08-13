import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMyApointments = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const appointments = await prisma.factAppointments.findMany({
            where: { userId },
            orderBy: { appointmentDate: 'desc' },
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const documents = await prisma.submittedDocument.findMany({
            where: { appointment: { userId } },
            select: { externalDocumentId: true },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(documents.map(d => d.externalDocumentId));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
