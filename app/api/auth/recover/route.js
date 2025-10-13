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
    const resetLink = `connect:/auth/reset-password?token=${token}`;

    // Send via Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const html = `
      <div style="font-family:sans-serif;padding:20px;background:#f9f9f9;">
        <h2 style="color:#333;">Reset Your Password</h2>
        <p>Hi ${userData.fullName || "User"},</p>
        <p>We received a request to reset your password. Tap the button below to set a new one:</p>
        <a href="${resetLink}" 
           style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0;">
           Reset Password
        </a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
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
