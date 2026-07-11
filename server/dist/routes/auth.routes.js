"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../prisma");
const email_service_1 = require("../services/email.service");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: 'Missing fields' });
    try {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ error: 'Email already exists' });
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { name, email, passwordHash },
        });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma_1.prisma.verificationOTP.create({
            data: {
                code: otp,
                userId: user.id,
                type: 'REGISTER',
                expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
            }
        });
        await (0, email_service_1.sendOTP)(email, otp);
        res.json({ success: true, message: 'OTP sent to email' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const record = await prisma_1.prisma.verificationOTP.findFirst({
            where: { userId: user.id, code: otp, type: 'REGISTER' },
            orderBy: { createdAt: 'desc' }
        });
        if (!record || record.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
        await prisma_1.prisma.verificationOTP.deleteMany({ where: { userId: user.id, type: 'REGISTER' } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Email not verified' });
        }
        // Generate OTP for login
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma_1.prisma.verificationOTP.create({
            data: {
                code: otp,
                userId: user.id,
                type: 'LOGIN', // Using 'LOGIN' type or simply distinguish it
                expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
            }
        });
        await (0, email_service_1.sendOTP)(email, otp);
        res.json({ success: true, message: 'OTP sent to email', requireOTP: true });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/login-verify', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const record = await prisma_1.prisma.verificationOTP.findFirst({
            where: { userId: user.id, code: otp },
            orderBy: { createdAt: 'desc' }
        });
        if (!record || record.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        // OTP valid, delete it
        await prisma_1.prisma.verificationOTP.delete({ where: { id: record.id } });
        // Generate tokens
        const { accessToken, refreshToken } = (0, auth_service_1.generateTokens)(user.id);
        await prisma_1.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.json({ success: true, accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (error) {
        console.error('Login verify error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
