import nodemailer from 'nodemailer';

export async function POST(req) {
  // Read the raw body once
  const rawBody = await req.text();
  console.log('Raw request body:', rawBody);

  // Parse the JSON manually
  let body;
  try {
    body = JSON.parse(rawBody);
    console.log('Parsed request body:', body);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON format' }), { status: 400 });
  }

  const { email } = body;
  if (!email) {
    console.log('Email is missing from body:', body);
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
  }

  // Generate 4-digit OTP (1000 to 9999)
  const otp = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');

  // Nodemailer setup (configure with your email service)
  const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., Gmail, or use your SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Verification',
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });
    console.log('Email sent successfully to:', email);
    return new Response(JSON.stringify({ otp }), { status: 200 });
  } catch (error) {
    console.error('Email sending failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to send OTP email' }), { status: 500 });
  }
}