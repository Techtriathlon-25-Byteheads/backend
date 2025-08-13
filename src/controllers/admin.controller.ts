import { Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.dimUsers.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role === 'CITIZEN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAppointmentsForDepartment = async (req: AuthRequest, res: Response) => {
    const adminId = req.user!.userId;
    try {
        // This is a placeholder for getting the admin's department.
        // In a real app, you'd have a relation between the admin user and their department.
        const departmentId = "DEP1723532294023"; // Example department ID

        const appointments = await prisma.factAppointments.findMany({
            where: { departmentId },
            include: { user: true, service: true, submittedDocuments: true },
            orderBy: { appointmentDate: 'asc' },
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    const { appointmentId } = req.params;
    const { status, notes } = req.body;
    try {
        const updatedAppointment = await prisma.factAppointments.update({
            where: { appointmentId },
            data: { status, notes },
        });
        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDocumentStatus = async (req: AuthRequest, res: Response) => {
    const { documentId } = req.params;
    const { isApproved, remarks } = req.body;
    try {
        const updatedDocument = await prisma.submittedDocument.update({
            where: { documentId },
            data: { isApproved, remarks },
        });
        res.status(200).json(updatedDocument);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
