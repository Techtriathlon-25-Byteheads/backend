import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getDay, format } from 'date-fns';

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
    const dayOfWeekName = format(bookingDate, 'EEEE').toLowerCase(); // e.g., 'monday'

    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId },
            select: { serviceId: true, maxCapacityPerSlot: true, operationalHours: true },
        });

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const maxCapacity = service.maxCapacityPerSlot || 6;
        const operationalHours = service.operationalHours as Record<string, string[]> | null;

        // Get valid time slots for the requested day
        const validTimeSlots: string[] = operationalHours?.[dayOfWeekName] || [];

        if (validTimeSlots.length === 0) {
            return res.status(200).json({ slots: [] }); // Service not operational on this day
        }

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

        const slots = validTimeSlots.map(slot => {
            const appointmentCount = appointments.find(a => {
                // Convert stored appointmentTime (Date object) to HH:MM string for comparison
                const storedTime = a.appointmentTime ? format(new Date(a.appointmentTime), 'HH:mm') : null;
                return storedTime === slot;
            });
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

import { createAppointment } from '../services/appointment.service';

export const bookAppointment = async (req: AuthRequest, res: Response) => {
    const { departmentId, serviceId, appointmentDate, appointmentTime, notes } = req.body;
    const userId = req.user!.userId;

    try {
        const newAppointment = await createAppointment({
            userId,
            departmentId,
            serviceId,
            appointmentDate,
            appointmentTime,
            notes,
        });
        res.status(201).json(newAppointment);
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Service not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'This time slot is full.') {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'Service not operational on this day or time.') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};