import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../prisma';
import { requireAuth, AuthRequest } from '../services/auth.service';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, avatarBase64 } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let avatarUrl = user.avatar;

    if (avatarBase64) {
      const uploadResult = await cloudinary.uploader.upload(avatarBase64, {
        folder: 'sqlstudio_avatars'
      });
      avatarUrl = uploadResult.secure_url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name, avatar: avatarUrl }
    });

    res.json({ 
      success: true, 
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, avatar: updatedUser.avatar } 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const format = req.query.format || 'json';

    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        queries: true,
        tables: { include: { columns: true } },
        auditLogs: true,
        aiUsages: true,
        sessions: true
      }
    });

    if (!fullUser) return res.status(404).json({ error: 'User not found' });

    const exportData = {
      profile: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        avatar: fullUser.avatar,
        isVerified: fullUser.isVerified,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt
      },
      savedQueries: fullUser.queries.filter(q => q.isFavorite),
      queryHistory: fullUser.queries.filter(q => !q.isFavorite),
      schemaTables: fullUser.tables,
      auditLogs: fullUser.auditLogs,
      aiUsage: fullUser.aiUsages,
      sessions: fullUser.sessions
    };

    if (format === 'csv') {
      const headers = 'title,dialect,sql,createdAt\n';
      const rows = fullUser.queries.map(q => `"${q.title || ''}","${q.dialect}","${q.sql.replace(/"/g, '""')}","${q.createdAt}"`).join('\n');
      return res.attachment('sql-studio-export.csv').send(headers + rows);
    }

    if (format === 'sql') {
      const sqlDump = fullUser.queries.map(q => `-- ${q.title || 'Query'}\n${q.sql};`).join('\n\n');
      return res.attachment('sql-studio-export.sql').send(sqlDump);
    }

    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

router.delete('/delete-account', requireAuth, async (req: AuthRequest, res: Response) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Incorrect password' });

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      const urlParts = user.avatar.split('/');
      const filenameWithExt = urlParts.pop();
      const folder = urlParts.pop();
      if (filenameWithExt && folder) {
        const filename = filenameWithExt.split('.')[0];
        const publicId = `${folder}/${filename}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.error('Failed to delete cloudinary image', e);
        }
      }
    }

    await prisma.$transaction([
      prisma.sqlQuery.deleteMany({ where: { userId } }),
      prisma.schemaTable.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.verificationOTP.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
      prisma.aIUsage.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
