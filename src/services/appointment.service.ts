import prisma from '../config/prisma';
import { format } from 'date-fns';

interface AppointmentData {
    userId: string;
    departmentId: string;
    serviceId: string;
    appointmentDate: string;
    appointmentTime: string;
    notes?: string;
}

export const createAppointment = async (data: AppointmentData) => {
    const { userId, departmentId, serviceId, appointmentDate, appointmentTime, notes } = data;

    const service = await prisma.dimServices.findUnique({
        where: { serviceId },
        select: { serviceId: true, maxCapacityPerSlot: true, operationalHours: true },
    });
    if (!service) {
        throw new Error('Service not found');
    }

    const maxCapacity = service.maxCapacityPerSlot || 6;

    const bookingDate = new Date(appointmentDate);
    const dayOfWeekName = format(bookingDate, 'EEEE').toLowerCase();
    const operationalHours = service.operationalHours as Record<string, string[]> | null;

    // Validate against operational hours
    const validTimeSlots: string[] = operationalHours?.[dayOfWeekName] || [];
    if (!validTimeSlots.includes(appointmentTime)) {
        throw new Error('Service not operational on this day or time.');
    }

    const bookingTime = new Date(`1970-01-01T${appointmentTime}:00.000Z`);

    const currentAppointmentsInSlot = await prisma.factAppointments.count({
        where: {
            serviceId,
            appointmentDate: bookingDate,
            appointmentTime: bookingTime,
        },
    });

    if (currentAppointmentsInSlot >= maxCapacity) {
        throw new Error('This time slot is full.');
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

    return newAppointment;
};