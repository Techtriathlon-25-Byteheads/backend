import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppointmentStatus } from '@prisma/client';

export const getMyProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    try {
        const user = await prisma.dimUsers.findUnique({
            where: { userId },
            select: { 
                userId: true, 
                email: true, 
                firstName: true, 
                lastName: true, 
                phone: true, 
                nationalId: true, 
                dateOfBirth: true, 
                gender: true, 
                address: true, 
                preferredLanguage: true 
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { firstName, lastName, phone, address, preferredLanguage } = req.body;

    try {
        const updatedUser = await prisma.dimUsers.update({
            where: { userId },
            data: {
                firstName,
                lastName,
                phone,
                address,
                preferredLanguage,
            },
        });

        const { passwordHash, ...userData } = updatedUser;
        res.status(200).json(userData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getUserAppointments = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { status } = req.query; // Get status from query parameter

    try {
        let whereClause: any = { userId };

        if (status) {
            // Validate status against the enum
            const validStatuses = Object.values(AppointmentStatus);
            if (!validStatuses.includes(status as AppointmentStatus)) {
                return res.status(400).json({ message: 'Invalid appointment status provided.' });
            }
            whereClause.status = status as AppointmentStatus;
        }

        const appointments = await prisma.factAppointments.findMany({
            where: whereClause,
            include: { service: true, department: true, submittedDocuments: true },
            orderBy: { appointmentDate: 'desc' },
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const cancelMyAppointment = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { appointmentId } = req.params;

    try {
        const appointment = await prisma.factAppointments.findUnique({
            where: { appointmentId },
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        if (appointment.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' });
        }

        const updatedAppointment = await prisma.factAppointments.update({
            where: { appointmentId },
            data: { status: 'cancelled' },
        });

        res.status(200).json(updatedAppointment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};