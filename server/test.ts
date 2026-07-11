import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000';

async function testApi() {
  console.log('--- STARTING INTEGRATION TEST ---');

  // 1. Healthcheck
  console.log('\\n1. Testing Healthcheck...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log('Status:', healthRes.status, await healthRes.json());

  // 2. Register
  console.log('\\n2. Testing Registration (Brevo Email API)...');
  const testEmail = `test${Date.now()}@sqlstudio.local`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'password123' })
  });
  console.log('Register Status:', registerRes.status, await registerRes.json());

  // 3. Fetch OTP from DB directly
  console.log('\\n3. Fetching OTP from Database...');
  const user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) throw new Error('User not created');
  const otpRecord = await prisma.verificationOTP.findFirst({ where: { userId: user.id } });
  console.log('OTP retrieved:', otpRecord?.code);

  // 4. Verify OTP
  console.log('\\n4. Verifying OTP...');
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: otpRecord?.code })
  });
  console.log('Verify Status:', verifyRes.status, await verifyRes.json());

  // 5. Login
  console.log('\\n5. Testing Login (JWT Generation)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'password123' })
  });
  const loginData: any = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'Token received:', !!loginData.accessToken);
  const token = loginData.accessToken;

  // 6. Generate SQL
  console.log('\\n6. Testing SQL Generation (Gemini API)...');
  const genRes = await fetch(`${BASE_URL}/api/sql/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      prompt: 'Create a products table with id, title, price, and created date',
      dialect: 'PostgreSQL',
      queryType: 'CREATE'
    })
  });
  console.log('Generate Status:', genRes.status);
  const genData = await genRes.json();
  console.log('SQL generated:\\n', genData.sql);
  console.log('Explanation:', genData.explanation);

  console.log('\\n--- INTEGRATION TEST COMPLETE ---');
}

testApi()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
