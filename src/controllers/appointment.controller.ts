import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const MAX_APPOINTMENTS_PER_SLOT = 6;

export const getServicesForDepartment = async (req: Request, res: Response) => {
    const { departmentId } = req.params;
    try {
        const services = await prisma.dimDepartmentService.findMany({
            where: { departmentId },
            include: { service: true },
        });
        res.status(200).json(services.map(s => s.service));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const { date } = req.query; // date in YYYY-MM-DD format

    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    const bookingDate = new Date(date as string);
    const dayOfWeek = bookingDate.getDay();

    // Assuming working days are Monday (1) to Friday (5)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.status(200).json({ slots: [] });
    }

    const timeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00',
        '13:00', '14:00', '15:00' // 12-1pm is lunch break
    ];

    try {
        const service = await prisma.dimServices.findUnique({ where: { serviceId } });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const maxCapacity = service.maxCapacityPerSlot || 6; // Default to 6 if not set

        const appointments = await prisma.factAppointments.groupBy({
            by: ['appointmentTime'],
            where: {
                serviceId,
                appointmentDate: bookingDate,
            },
            _count: {
                appointmentId: true,
            },
        });

        const slots = timeSlots.map(slot => {
            const appointmentCount = appointments.find(a => new Date(a.appointmentTime!).toISOString().endsWith(`${slot}:00.000Z`));
            const currentQueueSize = appointmentCount ? appointmentCount._count.appointmentId : 0;
            return {
                time: slot,
                currentQueueSize,
                maxCapacity,
                isAvailable: currentQueueSize < maxCapacity,
            };
        });

        res.status(200).json({ slots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const bookAppointment = async (req: AuthRequest, res: Response) => {
    const { departmentId, serviceId, appointmentDate, appointmentTime, notes } = req.body;
    const userId = req.user!.userId;

    try {
        const service = await prisma.dimServices.findUnique({ where: { serviceId } });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const maxCapacity = service.maxCapacityPerSlot || 6;

        const bookingDate = new Date(appointmentDate);
        const bookingTime = new Date(`1970-01-01T${appointmentTime}:00.000Z`);

        const currentAppointmentsInSlot = await prisma.factAppointments.count({
            where: {
                serviceId,
                appointmentDate: bookingDate,
                appointmentTime: bookingTime,
            },
        });

        if (currentAppointmentsInSlot >= maxCapacity) {
            return res.status(409).json({ message: 'This time slot is full.' });
        }

        const newAppointment = await prisma.factAppointments.create({
            data: {
                appointmentId: `APP${Date.now()}`,
                userId,
                departmentId,
                serviceId,
                appointmentDate: bookingDate,
                appointmentTime: bookingTime,
                notes,
            },
        });
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addDocument = async (req: AuthRequest, res: Response) => {
    const { appointmentId } = req.params;
    const { externalDocumentId } = req.body;

    if (!externalDocumentId) {
        return res.status(400).json({ message: 'externalDocumentId is required' });
    }

    try {
        const document = await prisma.submittedDocument.create({
            data: {
                appointmentId,
                externalDocumentId,
            },
        });
        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
