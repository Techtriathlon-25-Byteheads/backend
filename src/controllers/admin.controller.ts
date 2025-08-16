import { Response, Request } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';

// ... (login function remains the same)
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

// --- Appointment Management for Admins ---

const getAdminServiceIds = async (adminId: string): Promise<string[]> => {
    const admin = await prisma.dimUsers.findUnique({
        where: { userId: adminId },
        include: { assignedServices: { select: { serviceId: true } } },
    });
    return admin?.assignedServices.map(s => s.serviceId) || [];
};

export const getAdminAppointments = async (req: AuthRequest, res: Response) => {
    const admin = req.user!;

    try {
        let whereClause: any = {};

        if (admin.role === 'ADMIN') {
            const assignedServiceIds = await getAdminServiceIds(admin.userId);
            if (assignedServiceIds.length === 0) {
                return res.status(200).json([]); // Return empty if no services are assigned
            }
            whereClause.serviceId = { in: assignedServiceIds };
        }
        // SUPER_ADMIN has no restrictions, so the whereClause remains empty

        const appointments = await prisma.factAppointments.findMany({
            where: whereClause,
            include: { user: true, service: true, submittedDocuments: true },
            orderBy: { appointmentDate: 'asc' },
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createAdminAppointment = async (req: AuthRequest, res: Response) => {
    const admin = req.user!;
    const { userId, departmentId, serviceId, appointmentDate, appointmentTime, notes } = req.body;

    try {
        if (admin.role === 'ADMIN') {
            const assignedServiceIds = await getAdminServiceIds(admin.userId);
            if (!assignedServiceIds.includes(serviceId)) {
                return res.status(403).json({ message: 'You are not authorized to create appointments for this service.' });
            }
        }

        const newAppointment = await prisma.factAppointments.create({
            data: { 
                appointmentId: `APP${Date.now()}`,
                userId, 
                departmentId, 
                serviceId, 
                appointmentDate: new Date(appointmentDate), 
                appointmentTime: new Date(`1970-01-01T${appointmentTime}:00.000Z`), 
                notes 
            },
        });
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    const admin = req.user!;
    const { appointmentId } = req.params;
    const { status, notes } = req.body;

    try {
        if (admin.role === 'ADMIN') {
            const appointment = await prisma.factAppointments.findUnique({ where: { appointmentId } });
            if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

            const assignedServiceIds = await getAdminServiceIds(admin.userId);
            if (!assignedServiceIds.includes(appointment.serviceId)) {
                return res.status(403).json({ message: 'You are not authorized to update this appointment.' });
            }
        }

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

export const deleteAdminAppointment = async (req: AuthRequest, res: Response) => {
    const admin = req.user!;
    const { appointmentId } = req.params;

    try {
        if (admin.role === 'ADMIN') {
            const appointment = await prisma.factAppointments.findUnique({ where: { appointmentId } });
            if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

            const assignedServiceIds = await getAdminServiceIds(admin.userId);
            if (!assignedServiceIds.includes(appointment.serviceId)) {
                return res.status(403).json({ message: 'You are not authorized to delete this appointment.' });
            }
        }

        await prisma.factAppointments.delete({ where: { appointmentId } });
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ... (updateDocumentStatus and all other admin/user management functions remain the same)

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

// --- Admin Management (Super Admin Only) ---

export const createAdmin = async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, serviceIds } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdmin = await prisma.dimUsers.create({
            data: {
                userId: `USR${Date.now()}`,
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                role: 'ADMIN',
                isVerified: true,
                isActive: true,
                assignedServices: serviceIds ? {
                    create: serviceIds.map((id: string) => ({ serviceId: id }))
                } : undefined,
            },
            include: {
                assignedServices: { include: { service: true } },
            }
        });

        const { passwordHash, ...adminData } = newAdmin;
        res.status(201).json(adminData);

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'An admin with this email already exists.' });
        }
        console.error("Error creating admin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await prisma.dimUsers.findMany({
            where: { role: 'ADMIN' },
            include: {
                assignedServices: { select: { service: { select: { serviceId: true, serviceName: true } } } },
            },
        });
        res.status(200).json(admins.map(a => {
            const { passwordHash, ...adminData } = a;
            return adminData;
        }));
    } catch (error) {
        console.error("Error fetching admins:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateAdmin = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { email, firstName, lastName, isActive, serviceIds } = req.body;

    try {
        const updatedAdmin = await prisma.dimUsers.update({
            where: { userId, role: 'ADMIN' },
            data: {
                email,
                firstName,
                lastName,
                isActive,
                assignedServices: serviceIds ? {
                    // First, remove all existing assignments
                    deleteMany: {},
                    // Then, create the new ones
                    create: serviceIds.map((id: string) => ({ serviceId: id }))
                } : undefined,
            },
            include: {
                assignedServices: { include: { service: true } },
            }
        });

        const { passwordHash, ...adminData } = updatedAdmin;
        res.status(200).json(adminData);

    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Admin not found.' });
        }
        console.error(`Error updating admin ${userId}:`, error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // The schema is set to cascade delete assignments, so we only need to delete the user.
        await prisma.dimUsers.delete({
            where: { userId, role: 'ADMIN' },
        });
        res.status(204).send();
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Admin not found.' });
        }
        console.error(`Error deleting admin ${userId}:`, error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- User Management (Super Admin Only) ---

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    const admin = req.user!;

    try {
        if (admin.role === 'SUPER_ADMIN') {
            const users = await prisma.dimUsers.findMany({
                select: { userId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
            });
            return res.status(200).json(users);
        }

        const assignedServiceIds = await getAdminServiceIds(admin.userId);
        if (assignedServiceIds.length === 0) {
            return res.status(200).json([]);
        }

        const users = await prisma.dimUsers.findMany({
            where: {
                appointments: {
                    some: {
                        serviceId: { in: assignedServiceIds },
                    },
                },
            },
            select: { userId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { email, firstName, lastName, isActive, role } = req.body;

    try {
        const updatedUser = await prisma.dimUsers.update({
            where: { userId },
            data: {
                email,
                firstName,
                lastName,
                isActive,
                role,
            },
        });

        const { passwordHash, ...userData } = updatedUser;
        res.status(200).json(userData);

    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found.' });
        }
        console.error(`Error updating user ${userId}:`, error);
        res.status(500).json({ message: "Internal server error" });
    }
};
