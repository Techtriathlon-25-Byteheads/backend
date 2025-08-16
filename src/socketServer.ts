import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './config/prisma';
import { createAppointment } from './services/appointment.service';
import { format } from 'date-fns';

// Define a custom interface for Sockets that includes user information
interface SocketWithUser extends Socket {
  user?: {
    userId: string;
    role: string;
  };
}

interface AppointmentBookingData {
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  notes?: string;
}

const getServiceSlotsData = async (serviceId: string, date: Date) => {
    const dayOfWeekName = format(date, 'EEEE').toLowerCase();

    const service = await prisma.dimServices.findUnique({
        where: { serviceId },
        select: { serviceId: true, maxCapacityPerSlot: true, operationalHours: true },
    });

    if (!service) {
        return null; // Service not found
    }

    const maxCapacity = service.maxCapacityPerSlot || 6;
    const operationalHours = service.operationalHours as Record<string, string[]> | null;
    const validTimeSlots: string[] = operationalHours?.[dayOfWeekName] || [];

    if (validTimeSlots.length === 0) {
        return []; // Service not operational on this day
    }

    const appointments = await prisma.factAppointments.groupBy({
        by: ['appointmentTime'],
        where: {
            serviceId,
            appointmentDate: date,
        },
        _count: {
            appointmentId: true,
        },
    });

    const slots = validTimeSlots.map(slot => {
        const appointmentCount = appointments.find(a => {
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

    return slots;
};

export const initializeSocketLogic = (io: Server) => {
  // Socket.IO middleware for authentication
  io.use((socket: SocketWithUser, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }

  console.log("JWT fron socket : ", token)


    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err: any, decoded: any) => {
      if (err) {
        console.log("Authentication error: Invalid token")
        return next(new Error('Authentication error: Invalid token.'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket: SocketWithUser) => {
    console.log('A user connected:', socket.id, 'User:', socket.user);

    if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'superadmin')) {
      socket.join('admin_dashboard');
      console.log(`User ${socket.id} joined the admin_dashboard room.`);
    }

    socket.on('join_service_queue', async (serviceId: string) => {
      try {
        console.log(`User ${socket.id} is joining queue for service ${serviceId}`);
        const roomName = `service-${serviceId}`;
        socket.join(roomName);

        const slots = await getServiceSlotsData(serviceId, new Date());

        socket.emit('queue_update', { serviceId, slots });
      } catch (error) {
        console.error(`Error joining service queue for service ${serviceId}:`, error);
        socket.emit('error', { message: 'Could not join service queue.' });
      }
    });

    socket.on('book_appointment', async (data: AppointmentBookingData) => {
      if (!socket.user) {
        return socket.emit('error', { message: 'Authentication error.' });
      }

      try {
        const { serviceId } = data;
        const newAppointment = await createAppointment({ ...data, userId: socket.user.userId });

        // Notify the user that the booking was successful
        socket.emit('appointment_booked', newAppointment);

        // Calculate the new queue count
        const slots = await getServiceSlotsData(serviceId, new Date(data.appointmentDate));

        // Broadcast the updated queue count to the service room
        const roomName = `service-${serviceId}`;
        io.to(roomName).emit('queue_update', { serviceId, slots });

        // Broadcast the update to the admin dashboard
        io.to('admin_dashboard').emit('admin_queue_update', { serviceId, slots });

      } catch (error: any) {
        console.error(`Appointment booking failed for user ${socket.user.userId}:`, error);
        socket.emit('error', { message: error.message || 'Failed to book appointment.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};