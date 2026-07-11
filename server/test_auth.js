async function fetchPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return { data };
}

async function test() {
  try {
    const email = 'test' + Date.now() + '@example.com';
    const password = 'password123';
    
    console.log('1. Registering user...');
    const regRes = await fetchPost('http://localhost:5000/api/auth/register', {
      name: 'Test',
      email,
      password
    });
    console.log('Register response:', regRes.data);

    console.log('\n2. Trying invalid OTP (REGISTER)...');
    try {
      const verifyRes = await fetchPost('http://localhost:5000/api/auth/verify-otp', {
        email,
        otp: '000000'
      });
      console.log('Verify response (SHOULD NOT HAPPEN):', verifyRes.data);
    } catch (e) {
      console.log('Verify failed correctly:', e.response?.data);
    }

    console.log('\n3. Logging in with WRONG password...');
    try {
      await fetchPost('http://localhost:5000/api/auth/login', {
        email,
        password: 'wrongpassword'
      });
    } catch (e) {
      console.log('Login failed correctly (wrong pw):', e.response?.data);
    }

    console.log('\n4. Logging in with RIGHT password (unverified)...');
    try {
      await fetchPost('http://localhost:5000/api/auth/login', {
        email,
        password
      });
    } catch (e) {
      console.log('Login failed correctly (unverified):', e.response?.data);
    }

  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
  }
}

test();
