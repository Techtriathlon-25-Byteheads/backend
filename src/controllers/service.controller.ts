import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAllServices = async (req: Request, res: Response) => {
    try {
        const services = await prisma.dimServices.findMany();
        res.status(200).json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getServiceById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const service = await prisma.dimServices.findUnique({ where: { serviceId: id } });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createService = async (req: Request, res: Response) => {
    const { serviceName, description, serviceCategory, processingTimeDays, feeAmount, requiredDocuments, eligibilityCriteria, onlineAvailable, appointmentRequired, maxCapacityPerSlot } = req.body;
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
    const { serviceName, description, serviceCategory, processingTimeDays, feeAmount, requiredDocuments, eligibilityCriteria, onlineAvailable, appointmentRequired, isActive, maxCapacityPerSlot } = req.body;
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
        await prisma.dimServices.delete({ where: { serviceId: id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
