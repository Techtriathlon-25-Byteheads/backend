import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DepartmentAddress } from '../types';

export const getAllDepartments = async (req: Request, res: Response) => {
    const { sortBy, order } = req.query;

    try {
        let orderBy = {};

        if (sortBy === 'city') {
            orderBy = {
                headOfficeAddress: {
                    path: ['city'],
                    sort: order === 'desc' ? 'desc' : 'asc',
                },
            };
        }

        const departments = await prisma.dimDepartments.findMany({ orderBy });
        res.status(200).json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDepartmentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const department = await prisma.dimDepartments.findUnique({ where: { departmentId: id } });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    const { departmentName, description, headOfficeAddress, contactInfo, operatingHours }: { headOfficeAddress: DepartmentAddress, [key: string]: any } = req.body;
    
    if (!headOfficeAddress || !headOfficeAddress.city || !headOfficeAddress.street) {
        return res.status(400).json({ message: 'headOfficeAddress with city and street is required.' });
    }

    try {
        const newDepartment = await prisma.dimDepartments.create({
            data: {
                departmentId: `DEP${Date.now()}`,
                departmentName,
                description,
                headOfficeAddress: headOfficeAddress as any, // Cast to any to satisfy Prisma's JsonValue type
                contactInfo,
                operatingHours,
            },
        });
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { departmentName, description, headOfficeAddress, contactInfo, operatingHours, isActive }: { headOfficeAddress?: DepartmentAddress, [key: string]: any } = req.body;
    try {
        const updatedDepartment = await prisma.dimDepartments.update({
            where: { departmentId: id },
            data: {
                departmentName,
                description,
                headOfficeAddress: headOfficeAddress as any, // Cast to any to satisfy Prisma's JsonValue type
                contactInfo,
                operatingHours,
                isActive,
            },
        });
        res.status(200).json(updatedDepartment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.dimDepartments.delete({ where: { departmentId: id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addServiceToDepartment = async (req: Request, res: Response) => {
    const { departmentId, serviceId } = req.params;
    try {
        const departmentService = await prisma.dimDepartmentService.create({
            data: {
                departmentId,
                serviceId,
            },
        });
        res.status(201).json(departmentService);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeServiceFromDepartment = async (req: Request, res: Response) => {
    const { departmentId, serviceId } = req.params;
    try {
        await prisma.dimDepartmentService.delete({
            where: {
                departmentId_serviceId: {
                    departmentId,
                    serviceId,
                },
            },
        });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};