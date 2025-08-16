import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAllServices = async (req: Request, res: Response) => {
    try {
        const services = await prisma.dimServices.findMany({
            where: { isDeleted: false },
            include: {
                departments: {
                    select: {
                        departmentId: true,
                    }
                }
            }
        });

        const formattedServices = services.map(service => {
            return {
                ...service,
                departmentId: service.departments.length > 0 ? service.departments[0].departmentId : null,
                departments: undefined
            }
        });

        res.status(200).json(formattedServices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            include: {
                departments: {
                    select: {
                        departmentId: true,
                    }
                }
            }
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const formattedService = {
            ...service,
            departmentId: service.departments.length > 0 ? service.departments[0].departmentId : null,
            departments: undefined
        }

        res.status(200).json(formattedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createService = async (req: Request, res: Response) => {
    const { serviceName, description, serviceCategory, processingTimeDays, feeAmount, requiredDocuments, eligibilityCriteria, onlineAvailable, appointmentRequired, maxCapacityPerSlot, operationalHours } = req.body;

    if (operationalHours && (typeof operationalHours !== 'object' || Array.isArray(operationalHours))) {
        return res.status(400).json({ message: 'operationalHours must be a valid JSON object.' });
    }

    if (requiredDocuments) {
        if (typeof requiredDocuments !== 'object' || Array.isArray(requiredDocuments)) {
            return res.status(400).json({ message: 'requiredDocuments must be a valid JSON object.' });
        }
        if (!('usual' in requiredDocuments) || !('other' in requiredDocuments)) {
            return res.status(400).json({ message: 'requiredDocuments must have both usual and other properties.' });
        }
        if (typeof requiredDocuments.usual !== 'object' || Array.isArray(requiredDocuments.usual)) {
            return res.status(400).json({ message: 'requiredDocuments.usual must be a valid JSON object.' });
        }
        if (!Array.isArray(requiredDocuments.other)) {
            return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
        }
        if (requiredDocuments.other.some((item: any) => typeof item !== 'string')) {
            return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
        }
    }

    try {
        const newService = await prisma.dimServices.create({
            data: {
                serviceId: `SER${Date.now()}`,
                serviceName,
                description,
                serviceCategory,
                processingTimeDays,
                feeAmount,
                requiredDocuments,
                eligibilityCriteria,
                onlineAvailable,
                appointmentRequired,
                maxCapacityPerSlot,
                operationalHours,
            },
        });
        res.status(201).json(newService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateService = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { serviceName, description, serviceCategory, processingTimeDays, feeAmount, requiredDocuments, eligibilityCriteria, onlineAvailable, appointmentRequired, isActive, maxCapacityPerSlot, operationalHours } = req.body;

    if (operationalHours && (typeof operationalHours !== 'object' || Array.isArray(operationalHours))) {
        return res.status(400).json({ message: 'operationalHours must be a valid JSON object.' });
    }

    if (requiredDocuments) {
        if (typeof requiredDocuments !== 'object' || Array.isArray(requiredDocuments)) {
            return res.status(400).json({ message: 'requiredDocuments must be a valid JSON object.' });
        }
        if (!('usual' in requiredDocuments) || !('other' in requiredDocuments)) {
            return res.status(400).json({ message: 'requiredDocuments must have both usual and other properties.' });
        }
        if (typeof requiredDocuments.usual !== 'object' || Array.isArray(requiredDocuments.usual)) {
            return res.status(400).json({ message: 'requiredDocuments.usual must be a valid JSON object.' });
        }
        if (!Array.isArray(requiredDocuments.other)) {
            return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
        }
        if (requiredDocuments.other.some((item: any) => typeof item !== 'string')) {
            return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
        }
    }

    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: {
                serviceName,
                description,
                serviceCategory,
                processingTimeDays,
                feeAmount,
                requiredDocuments,
                eligibilityCriteria,
                onlineAvailable,
                appointmentRequired,
                isActive,
                maxCapacityPerSlot,
                operationalHours,
            },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteService = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.dimServices.update({
            where: { serviceId: id },
            data: { isDeleted: true, isActive: false },
        });
        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServicesByCategory = async (req: Request, res: Response) => {
    const { category } = req.params;
    try {
        const services = await prisma.dimServices.findMany({ where: { serviceCategory: category as any, isDeleted: false } });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceCount = async (req: Request, res: Response) => {
    try {
        const count = await prisma.dimServices.count({ where: { isDeleted: false } });
        res.status(200).json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceStats = async (req: Request, res: Response) => {
    try {
        const stats = await prisma.dimServices.aggregate({
            where: { isDeleted: false },
            _avg: {
                feeAmount: true,
                processingTimeDays: true,
            },
            _count: {
                _all: true,
            },
        });
        res.status(200).json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getActiveServices = async (req: Request, res: Response) => {
    try {
        const services = await prisma.dimServices.findMany({ where: { isActive: true, isDeleted: false } });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServicesWithAppointments = async (req: Request, res: Response) => {
    try {
        const services = await prisma.dimServices.findMany({ where: { appointmentRequired: true, isDeleted: false } });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServicesByFee = async (req: Request, res: Response) => {
    const { min, max } = req.query;
    try {
        const services = await prisma.dimServices.findMany({
            where: {
                feeAmount: {
                    gte: Number(min),
                    lte: Number(max),
                },
                isDeleted: false
            },
        });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServicesByProcessingTime = async (req: Request, res: Response) => {
    const { days } = req.query;
    try {
        const services = await prisma.dimServices.findMany({
            where: {
                processingTimeDays: {
                    lte: Number(days),
                },
                isDeleted: false
            },
        });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const searchServices = async (req: Request, res: Response) => {
    const { q } = req.query;
    try {
        const services = await prisma.dimServices.findMany({
            where: {
                OR: [
                    { serviceName: { contains: q as string, mode: 'insensitive' } },
                    { description: { contains: q as string, mode: 'insensitive' } },
                ],
                isDeleted: false
            },
        });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceOperationalHours = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { operationalHours: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service.operationalHours);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceOperationalHours = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { operationalHours } = req.body;

    if (!operationalHours || typeof operationalHours !== 'object' || Array.isArray(operationalHours)) {
        return res.status(400).json({ message: 'operationalHours must be a valid JSON object.' });
    }

    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { operationalHours },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceRequiredDocuments = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { requiredDocuments: true },
        });
        if (!service) {
            return res.status(44,).json({ message: 'Service not found' });
        }
        res.status(200).json(service.requiredDocuments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceRequiredDocuments = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { requiredDocuments } = req.body;

    if (!requiredDocuments) {
        return res.status(400).json({ message: 'requiredDocuments is required.' });
    }
    if (typeof requiredDocuments !== 'object' || Array.isArray(requiredDocuments)) {
        return res.status(400).json({ message: 'requiredDocuments must be a valid JSON object.' });
    }
    if (!('usual' in requiredDocuments) || !('other' in requiredDocuments)) {
        return res.status(400).json({ message: 'requiredDocuments must have both usual and other properties.' });
    }
    if (typeof requiredDocuments.usual !== 'object' || Array.isArray(requiredDocuments.usual)) {
        return res.status(400).json({ message: 'requiredDocuments.usual must be a valid JSON object.' });
    }
    if (!Array.isArray(requiredDocuments.other)) {
        return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
    }
    if (requiredDocuments.other.some((item: any) => typeof item !== 'string')) {
        return res.status(400).json({ message: 'requiredDocuments.other must be an array of strings.' });
    }

    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { requiredDocuments },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceEligibility = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { eligibilityCriteria: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json({ eligibilityCriteria: service.eligibilityCriteria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceEligibility = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { eligibilityCriteria } = req.body;
    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { eligibilityCriteria },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceCapacity = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { maxCapacityPerSlot: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json({ maxCapacityPerSlot: service.maxCapacityPerSlot });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceCapacity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { maxCapacityPerSlot } = req.body;
    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { maxCapacityPerSlot },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServicesByAvailability = async (req: Request, res: Response) => {
    const { online, appointment } = req.query;
    try {
        const services = await prisma.dimServices.findMany({
            where: {
                onlineAvailable: online === 'true' ? true : undefined,
                appointmentRequired: appointment === 'true' ? true : undefined,
                isDeleted: false
            },
        });
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceFee = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { feeAmount: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json({ feeAmount: service.feeAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceFee = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { feeAmount } = req.body;
    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { feeAmount },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceProcessingTime = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { processingTimeDays: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json({ processingTimeDays: service.processingTimeDays });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceProcessingTime = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { processingTimeDays } = req.body;
    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { processingTimeDays },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceIsActive = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({
            where: { serviceId: id, isDeleted: false },
            select: { isActive: true },
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json({ isActive: service.isActive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateServiceIsActive = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const updatedService = await prisma.dimServices.update({
            where: { serviceId: id },
            data: { isActive },
        });
        res.status(200).json(updatedService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};