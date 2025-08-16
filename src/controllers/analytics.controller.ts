import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

// --- Helper Functions ---

const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
};

const getAppointmentStats = async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const thisMonthCount = await prisma.factAppointments.count({
        where: { createdAt: { gte: startOfThisMonth } },
    });

    const lastMonthCount = await prisma.factAppointments.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
    });

    return {
        totalThisMonth: thisMonthCount,
        percentageChange: calculatePercentageChange(thisMonthCount, lastMonthCount),
    };
};

const getActiveServiceStats = async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    const thisMonthResult = await prisma.factAppointments.findMany({
        where: { createdAt: { gte: startOfThisMonth }, service: { isDeleted: false } },
        distinct: ['serviceId'],
        select: { serviceId: true },
    });

    const lastMonthResult = await prisma.factAppointments.findMany({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }, service: { isDeleted: false } },
        distinct: ['serviceId'],
        select: { serviceId: true },
    });

    return {
        totalThisMonth: thisMonthResult.length,
        percentageChange: calculatePercentageChange(thisMonthResult.length, lastMonthResult.length),
    };
};

const getOfficerStats = async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    const totalOfficers = await prisma.dimUsers.count({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });

    const newThisMonth = await prisma.dimUsers.count({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            createdAt: { gte: startOfThisMonth },
        },
    });

    const newLastMonth = await prisma.dimUsers.count({
        where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
    });

    return {
        totalOfficers: totalOfficers,
        percentageChange: calculatePercentageChange(newThisMonth, newLastMonth),
    };
};

const getPeakHoursToday = async () => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const result = await prisma.factAppointments.groupBy({
        by: ['appointmentTime'],
        where: { appointmentDate: { gte: startOfToday, lte: endOfToday } },
        _count: { appointmentTime: true },
        orderBy: { appointmentTime: 'asc' },
    });

    return result.map(item => ({
        time: item.appointmentTime ? new Date(item.appointmentTime).toTimeString().substring(0, 5) : 'Invalid Time',
        count: item._count.appointmentTime,
    }));
};

const getDepartmentLoad = async () => {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);

    const result = await prisma.factAppointments.groupBy({
        by: ['departmentId'],
        where: { createdAt: { gte: startOfThisMonth } },
        _count: { departmentId: true },
    });

    const departmentIds = result.map(item => item.departmentId);
    const departments = await prisma.dimDepartments.findMany({
        where: { departmentId: { in: departmentIds }, isDeleted: false },
        select: { departmentId: true, departmentName: true },
    });

    const departmentMap = new Map(departments.map(d => [d.departmentId, d.departmentName]));

    return result.map(item => ({
        departmentName: departmentMap.get(item.departmentId) || 'Unknown Department',
        count: item._count.departmentId,
    }));
};

const getQuickStatsToday = async () => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const completed = await prisma.factAppointments.count({
        where: { status: 'completed', updatedAt: { gte: startOfToday, lte: endOfToday } },
    });

    const pending = await prisma.factAppointments.count({
        where: {
            status: { in: ['scheduled', 'confirmed'] },
            appointmentDate: { gte: startOfToday, lte: endOfToday },
        },
    });

    const noShows = await prisma.factAppointments.count({
        where: { status: 'no_show', updatedAt: { gte: startOfToday, lte: endOfToday } },
    });

    const cancelled = await prisma.factAppointments.count({
        where: { status: 'cancelled', updatedAt: { gte: startOfToday, lte: endOfToday } },
    });

    return { completed, pending, noShows, cancelled };
};

// --- Main Controller --- 

export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const [appointmentStats, activeServiceStats, officerStats, peakHoursToday, departmentLoad, quickStatsToday] = await Promise.all([
            getAppointmentStats(),
            getActiveServiceStats(),
            getOfficerStats(),
            getPeakHoursToday(),
            getDepartmentLoad(),
            getQuickStatsToday(),
        ]);

        res.status(200).json({
            appointmentStats,
            activeServiceStats,
            officerStats,
            peakHoursToday,
            departmentLoad,
            quickStatsToday,
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
