

export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_EMAIL || 'noreply@sqlstudio.com';

  if (!apiKey) {
    console.warn(`[Email Mock] To: ${to}, Subject: ${subject}\\nContent: ${htmlContent}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'SQL Studio' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Brevo API Error:', err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendOTP = async (to: string, otp: string) => {
  const subject = 'Your SQL Studio Verification Code';
  const html = `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 15 minutes.</p>`;
  return sendEmail(to, subject, html);
};
