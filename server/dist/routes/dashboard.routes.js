"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
router.get('/', auth_service_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        // Get Total Queries
        const totalQueries = await prisma_1.prisma.sqlQuery.count({ where: { userId } });
        // Get Saved Queries (favorites)
        const savedQueries = await prisma_1.prisma.sqlQuery.count({ where: { userId, isFavorite: true } });
        // Get Database Tables
        const tables = await prisma_1.prisma.schemaTable.count({ where: { userId } });
        // Get AI Requests (tokens/usage)
        const aiUsage = await prisma_1.prisma.aIUsage.count({ where: { userId } });
        // Weekly activity (mocking the chart data shape but querying real counts)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.toISOString().split('T')[0]
            };
        });
        const recentQueries = await prisma_1.prisma.sqlQuery.findMany({
            where: {
                userId,
                createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
            },
            select: { createdAt: true }
        });
        const activityData = last7Days.map(day => {
            const count = recentQueries.filter(q => q.createdAt.toISOString().startsWith(day.date)).length;
            return { name: day.name, queries: count };
        });
        res.json({
            success: true,
            stats: {
                totalQueries,
                savedQueries,
                tables,
                aiRequests: aiUsage
            },
            activity: activityData
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
exports.default = router;
