import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { sendOTP } from '../services/email.service';
import { generateTokens } from '../services/auth.service';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationOTP.create({
      data: {
        code: otp,
        userId: user.id,
        type: 'REGISTER',
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
      }
    });

    await sendOTP(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const record = await prisma.verificationOTP.findFirst({
      where: { userId: user.id, code: otp, type: 'REGISTER' },
      orderBy: { createdAt: 'desc' }
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    await prisma.verificationOTP.deleteMany({ where: { userId: user.id, type: 'REGISTER' } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Generate OTP for login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationOTP.create({
      data: {
        code: otp,
        userId: user.id,
        type: 'LOGIN', // Using 'LOGIN' type or simply distinguish it
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 mins
      }
    });

    await sendOTP(email, otp);
    res.json({ success: true, message: 'OTP sent to email', requireOTP: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login-verify', async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const record = await prisma.verificationOTP.findFirst({
      where: { userId: user.id, code: otp },
      orderBy: { createdAt: 'desc' }
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // OTP valid, delete it
    await prisma.verificationOTP.delete({ where: { id: record.id } });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
