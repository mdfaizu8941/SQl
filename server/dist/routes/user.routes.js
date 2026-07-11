"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const cloudinary_1 = require("cloudinary");
const prisma_1 = require("../prisma");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
router.put('/profile', auth_service_1.requireAuth, async (req, res) => {
    const { name, avatarBase64 } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        let avatarUrl = user.avatar;
        if (avatarBase64) {
            const uploadResult = await cloudinary_1.v2.uploader.upload(avatarBase64, {
                folder: 'sqlstudio_avatars'
            });
            avatarUrl = uploadResult.secure_url;
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { name, avatar: avatarUrl }
        });
        res.json({
            success: true,
            user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, avatar: updatedUser.avatar }
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
router.put('/password', auth_service_1.requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const isValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid)
            return res.status(400).json({ error: 'Incorrect current password' });
        const newHash = await bcrypt_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash }
        });
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});
router.get('/export', auth_service_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const rawFormat = req.query.format;
        const format = typeof rawFormat === 'string' ? rawFormat : (Array.isArray(rawFormat) && typeof rawFormat[0] === 'string' ? rawFormat[0] : 'json');
        const fullUser = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                queries: true,
                tables: { include: { columns: true } },
                auditLogs: true,
                aiUsages: true,
                sessions: true
            }
        });
        if (!fullUser)
            return res.status(404).json({ error: 'User not found' });
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
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});
router.delete('/delete-account', auth_service_1.requireAuth, async (req, res) => {
    const { password } = req.body;
    if (!password)
        return res.status(400).json({ error: 'Password is required' });
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid)
            return res.status(400).json({ error: 'Incorrect password' });
        if (user.avatar && user.avatar.includes('cloudinary.com')) {
            const urlParts = user.avatar.split('/');
            const filenameWithExt = urlParts.pop();
            const folder = urlParts.pop();
            if (filenameWithExt && folder) {
                const filename = filenameWithExt.split('.')[0];
                const publicId = `${folder}/${filename}`;
                try {
                    await cloudinary_1.v2.uploader.destroy(publicId);
                }
                catch (e) {
                    console.error('Failed to delete cloudinary image', e);
                }
            }
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.sqlQuery.deleteMany({ where: { userId } }),
            prisma_1.prisma.schemaTable.deleteMany({ where: { userId } }),
            prisma_1.prisma.session.deleteMany({ where: { userId } }),
            prisma_1.prisma.refreshToken.deleteMany({ where: { userId } }),
            prisma_1.prisma.verificationOTP.deleteMany({ where: { userId } }),
            prisma_1.prisma.auditLog.deleteMany({ where: { userId } }),
            prisma_1.prisma.aIUsage.deleteMany({ where: { userId } }),
            prisma_1.prisma.user.delete({ where: { id: userId } })
        ]);
        res.json({ success: true, message: 'Account deleted successfully' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});
exports.default = router;
