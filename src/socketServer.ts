import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './config/prisma';
import { createAppointment } from './services/appointment.service';

// Define a custom interface for Sockets that includes user information
interface SocketWithUser extends Socket {
  user?: {
    userId: string;
    role: string;
  };
}

interface AppointmentBookingData {
  departmentId: string;
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  notes?: string;
}

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

        const queueCount = await prisma.factAppointments.count({
          where: {
            serviceId: serviceId,
            status: { in: ['scheduled', 'confirmed'] },
          },
        });

        socket.emit('queue_update', { serviceId, queueCount });
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
        const queueCount = await prisma.factAppointments.count({
          where: {
            serviceId: serviceId,
            status: { in: ['scheduled', 'confirmed'] },
          },
        });

        // Broadcast the updated queue count to the service room
        const roomName = `service-${serviceId}`;
        io.to(roomName).emit('queue_update', { serviceId, queueCount });

        // Broadcast the update to the admin dashboard
        io.to('admin_dashboard').emit('admin_queue_update', { serviceId, queueCount });

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