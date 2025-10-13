import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email)
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });

    // Check if user exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty)
      return new Response(JSON.stringify({ error: "No account found with that email" }), { status: 404 });

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Generate reset token
    const token = jwt.sign(
      { uid: userDoc.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Reset link (Deep link for your app)
    const resetLink = `connect://auth/reset?token=${token}`;

    // Send via Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: 'Poppins', sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 30px 25px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 150px;
          }
          h2 {
            text-align: center;
            font-weight: 600;
            color: #222;
            margin-bottom: 20px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            margin-top: 15px;
            transition: background 0.3s ease;
          }
          .button:hover {
            background: #0056b3;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Connect Logo" />
          </div>
          <h2>Reset Your Password</h2>
          <p>Hi <b>${userData.fullName || "User"}</b>,</p>
          <p>We received a request to reset your password for your Connect account. Click the button below to securely create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>

          <p>If you didn’t request this, you can safely ignore this email — your password will remain unchanged.</p>

          <div class="footer">
            <p>&copy; 2025 CONNECT. All rights reserved.</p>
            <p>If you have any questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Connect Password",
      html,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Password reset link sent to your email" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Password reset error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
