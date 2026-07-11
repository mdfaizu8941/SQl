"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_service_1 = require("../services/auth.service");
const generative_ai_1 = require("@google/generative-ai");
const router = (0, express_1.Router)();
const genAI = process.env.GEMINI_API_KEY ? new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
router.post('/generate', auth_service_1.requireAuth, async (req, res) => {
    const { prompt, dialect = 'PostgreSQL', queryType = 'Auto' } = req.body;
    if (!prompt)
        return res.status(400).json({ error: 'Prompt is required' });
    console.log('\\n--- [Backend] Received SQL Generation Request ---');
    console.log(`User: ${req.user.id} | Dialect: ${dialect} | Type: ${queryType}`);
    console.log(`Prompt: "${prompt}"`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Backend] GEMINI_API_KEY is missing. Returning mocked response.');
        return res.json({ sql: 'SELECT * FROM test;', explanation: 'Mocked response due to missing API key' });
    }
    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError = null;
    while (attempt < MAX_RETRIES) {
        attempt++;
        console.log(`\\n--- [Backend] Calling Gemini API (Attempt ${attempt}/${MAX_RETRIES}) ---`);
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const systemPrompt = `You are an experienced, elite Database Architect.
Your task is to analyze the business domain requested by the user and design a properly normalized relational database schema (Third Normal Form - 3NF).

Domain Request: "${prompt}"
SQL Dialect: ${dialect}
Query Type: ${queryType}

CRITICAL RULES:
1. Analyze the domain and identify ALL real-world entities. Do not lump unrelated entities into a single table.
2. Follow strict 3NF: No duplicated information, no repeating groups, no comma-separated values. Avoid JSON columns unless strictly necessary.
3. Every table MUST contain: Primary Key (SERIAL or UUID), Foreign Keys (automatically created), appropriate data types, Constraints (NOT NULL, UNIQUE), Indexes for foreign keys, and CHECK constraints where appropriate.
4. Add ON DELETE CASCADE or RESTRICT rules to foreign keys.
5. Use proper naming conventions (snake_case).
6. ALWAYS include 'created_at' and 'updated_at' timestamp columns in every table.
7. Generate ALL necessary CREATE TABLE statements.
8. Generate realistic sample data (INSERT statements) for all tables.
9. Return a valid JSON object EXACTLY matching this structure, with NO markdown formatting around it:
{
  "tables": [
    {
      "tableName": "string",
      "description": "string",
      "columns": ["string"],
      "relationships": ["string"]
    }
  ],
  "sql": "string containing ALL CREATE TABLE statements",
  "erd": "string describing the ER diagram or relationships visually",
  "sampleData": "string containing realistic INSERT statements",
  "explanation": "string explaining why every table exists and your design decisions"
}
ONLY RETURN THE JSON OBJECT.`;
            const result = await model.generateContent(systemPrompt);
            const text = result.response.text();
            console.log(`\\n--- [Backend] Gemini Raw Response (Attempt ${attempt}) ---`);
            console.log(text);
            console.log('\\n--- [Backend] Parsing JSON ---');
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not parse JSON from AI response. Received text: ' + text);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('\\n--- [Backend] JSON Parsed Successfully! ---');
            console.log(parsed);
            await prisma_1.prisma.aIUsage.create({
                data: {
                    userId: req.user.id,
                    tokens: 0,
                    prompt
                }
            });
            console.log('\\n--- [Backend] Response Sent to Frontend ---\\n');
            return res.json({
                sql: parsed.sql,
                explanation: parsed.explanation,
                tables: parsed.tables,
                erd: parsed.erd,
                sampleData: parsed.sampleData
            });
        }
        catch (error) {
            console.error(`\\n--- [Backend] Error on Attempt ${attempt} ---`);
            console.error(error);
            lastError = error;
            if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
                break;
            }
        }
    }
    console.error('\\n--- [Backend] SQL Generation Failed after all attempts ---');
    return res.status(500).json({
        error: 'Failed to generate SQL from AI',
        details: lastError?.message || 'Unknown Gemini API error'
    });
});
router.post('/save', auth_service_1.requireAuth, async (req, res) => {
    const { title, prompt, sql, dialect, type, explanation } = req.body;
    try {
        const snippet = await prisma_1.prisma.sqlQuery.create({
            data: {
                title, prompt, sql, dialect, type, explanation,
                userId: req.user.id
            }
        });
        res.json({ success: true, id: snippet.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save query' });
    }
});
router.get('/history', auth_service_1.requireAuth, async (req, res) => {
    try {
        const queries = await prisma_1.prisma.sqlQuery.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ history: queries });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load history' });
    }
});
router.delete('/history/:id', auth_service_1.requireAuth, async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string')
            return res.status(400).json({ error: 'Invalid ID' });
        await prisma_1.prisma.sqlQuery.delete({
            where: { id, userId: req.user.id }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete query' });
    }
});
router.post('/execute', auth_service_1.requireAuth, async (req, res) => {
    const { sql } = req.body;
    if (!sql)
        return res.status(400).json({ error: 'SQL is required' });
    try {
        const startTime = performance.now();
        // WARNING: EXECUTING ARBITRARY SQL ON PRIMARY DB
        const results = await prisma_1.prisma.$queryRawUnsafe(sql);
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);
        // queryRawUnsafe can return an array or a number (affected rows) depending on the query
        let data = [];
        let affectedRows = 0;
        if (Array.isArray(results)) {
            data = results;
            affectedRows = results.length;
        }
        else if (typeof results === 'number') {
            affectedRows = results;
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            success: true,
            data,
            affectedRows,
            executionTimeMs
        }, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    }
    catch (error) {
        console.error('SQL Execution Error:', error);
        res.status(400).json({
            error: 'Query execution failed',
            details: error.message || 'Unknown database error'
        });
    }
});
exports.default = router;
