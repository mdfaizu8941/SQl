"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
router.get('/tables', auth_service_1.requireAuth, async (req, res) => {
    try {
        const tables = await prisma_1.prisma.schemaTable.findMany({
            where: { userId: req.user.id },
            include: { columns: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ tables });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});
router.post('/tables/parse', auth_service_1.requireAuth, async (req, res) => {
    const { sql } = req.body;
    if (!sql)
        return res.status(400).json({ error: 'SQL required' });
    try {
        // Basic regex parser for CREATE TABLE
        const tableNameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['"`]?(\w+)['"`]?/i);
        if (!tableNameMatch)
            return res.status(400).json({ error: 'Could not parse table name' });
        const name = tableNameMatch[1];
        // Extract everything between the first ( and last )
        const columnsStringMatch = sql.match(/\(([\s\S]+)\)/);
        if (!columnsStringMatch)
            return res.status(400).json({ error: 'Could not parse columns' });
        const columnsString = columnsStringMatch[1];
        // Split by comma, but naive split might break on functions. For simple AI generated schemas, it should be fine.
        const rawColumns = columnsString.split(',').map((c) => c.trim()).filter(Boolean);
        const columns = [];
        for (const rawCol of rawColumns) {
            if (rawCol.toUpperCase().startsWith('PRIMARY KEY') || rawCol.toUpperCase().startsWith('FOREIGN KEY') || rawCol.toUpperCase().startsWith('UNIQUE') || rawCol.toUpperCase().startsWith('CONSTRAINT')) {
                continue;
            }
            const parts = rawCol.split(/\s+/);
            const colName = parts[0].replace(/['"`]/g, '');
            const type = parts[1]?.toUpperCase() || 'VARCHAR';
            const isNullable = !rawCol.toUpperCase().includes('NOT NULL');
            const isPrimary = rawCol.toUpperCase().includes('PRIMARY KEY');
            columns.push({
                name: colName,
                type: type,
                isNotNull: rawCol.toUpperCase().includes('NOT NULL'),
                isPrimaryKey: isPrimary,
            });
        }
        const table = await prisma_1.prisma.schemaTable.create({
            data: {
                name,
                userId: req.user.id,
                columns: {
                    create: columns
                }
            },
            include: { columns: true }
        });
        res.json({ success: true, table });
    }
    catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This table is already in your schema view!' });
        }
        res.status(500).json({ error: 'Failed to create table from SQL' });
    }
});
router.delete('/tables/:id', auth_service_1.requireAuth, async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string')
            return res.status(400).json({ error: 'Invalid ID' });
        await prisma_1.prisma.schemaTable.delete({
            where: { id, userId: req.user.id }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete table' });
    }
});
exports.default = router;
