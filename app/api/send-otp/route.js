import nodemailer from 'nodemailer';
import { db } from '@/lib//firebase';
import { doc, setDoc } from 'firebase/firestore';

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

  // Store OTP in Firestore
  try {
    await setDoc(doc(db, 'otp-verification', 'current-otp'), {
      otp,
      email,
      timestamp: new Date(),
    });
    console.log('OTP stored in Firestore:', { otp, email });
  } catch (error) {
    console.error('Failed to store OTP in Firestore:', error);
    return new Response(JSON.stringify({ error: 'Failed to store OTP' }), { status: 500 });
  }

  // Nodemailer setup (configure with your email service)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // HTML Email Template
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; box-sizing: border-box; }
        .header { text-align: center; padding: 12px 0; }
        .header img { max-width: 150px; height: auto; }
        .content { text-align: center; padding: 20px; }
        .otp { font-size: 24px; font-weight: bold; color: #1e90ff; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #777; padding: 10px 0; }

        @media (max-width: 600px) {
          .container { padding: 15px; }
          .header img { max-width: 120px; }
          .content { padding: 15px; }
          .otp { font-size: 20px; }
          h2 { font-size: 20px; }
          p { font-size: 14px; }
        }

        @media (max-width: 400px) {
          .header img { max-width: 100px; }
          .otp { font-size: 18px; }
          h2 { font-size: 18px; }
          p { font-size: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="CONNECT Logo">
        </div>
        <div class="content">
          <h2>Welcome to CONNECT!</h2>
          <p>Thank you for signing up. Your One-Time Password (OTP) for verification is:</p>
          <div class="otp">${otp}</div>
          <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          <p>If you didn’t request this, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 CONNECT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for CONNECT Verification',
      html: emailTemplate,
    });
    console.log('Email sent successfully to:', email);
    return new Response(JSON.stringify({ otp }), { status: 200 });
  } catch (error) {
    console.error('Email sending failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to send OTP email' }), { status: 500 });
  }
}