import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../services/auth.service';

const router = Router();

router.get('/tables', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.schemaTable.findMany({
      where: { userId: req.user!.id },
      include: { columns: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/tables/parse', requireAuth, async (req: AuthRequest, res: Response) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL required' });

  try {
    // Basic regex parser for CREATE TABLE
    const tableNameMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['"`]?(\w+)['"`]?/i);
    if (!tableNameMatch) return res.status(400).json({ error: 'Could not parse table name' });
    
    const name = tableNameMatch[1];
    
    // Extract everything between the first ( and last )
    const columnsStringMatch = sql.match(/\(([\s\S]+)\)/);
    if (!columnsStringMatch) return res.status(400).json({ error: 'Could not parse columns' });
    
    const columnsString = columnsStringMatch[1];
    // Split by comma, but naive split might break on functions. For simple AI generated schemas, it should be fine.
    const rawColumns = columnsString.split(',').map((c: string) => c.trim()).filter(Boolean);
    
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

    const table = await prisma.schemaTable.create({
      data: {
        name,
        userId: req.user!.id,
        columns: {
          create: columns
        }
      },
      include: { columns: true }
    });
    res.json({ success: true, table });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This table is already in your schema view!' });
    }
    res.status(500).json({ error: 'Failed to create table from SQL' });
  }
});

router.delete('/tables/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.schemaTable.delete({
      where: { id: req.params.id, userId: req.user!.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

export default router;
