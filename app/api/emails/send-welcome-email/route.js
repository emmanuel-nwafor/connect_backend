// /api/emails/send-welcome-email/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const { userId } = await req.json();
        if (!userId) {
            return new Response(JSON.stringify({ success: false, error: "userId is required" }), { status: 400 });
        }

        if (decoded.userId !== userId) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized request" }), { status: 403 });
        }

        // Fetch user
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }
        const userData = userSnap.data();

        // Configure transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email Template
        const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0; }
          .container { max-width: 700px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee; }
          .header img { max-width: 160px; }
          h2 { color: #333; }
          p { line-height: 1.6; color: #444; }
          .content { margin: 20px 0; font-size: 15px; }
          .cta { text-align: center; margin-top: 30px; }
          .cta a { background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Connect Logo">
            <h2>Welcome to Connect!</h2>
          </div>

          <p>Hello <b>${userData.fullName || "User"}</b>,</p>

          <div class="content">
            <p>We’re thrilled to have you join <b>Connect</b> — your one-stop platform for discovering, booking, and managing lodges and properties with ease.</p>
            
            <p>With Connect, you can:</p>
            <ul>
              <li>Find verified lodges, apartments, and shops that suit your needs.</li>
              <li>Book and pay securely — all within the app.</li>
              <li>Track your bookings and receive instant updates.</li>
              <li>Enjoy a seamless experience with our intuitive interface.</li>
            </ul>

            <p>Our goal is to make property booking and management simple, transparent, and stress-free — whether you’re a student, tenant, or property owner.</p>
          </div>

          <div class="cta">
            <a href="https://connectapp.vercel.app/">Explore Connect</a>
          </div>

          <div class="footer">
            <p>&copy; 2025 CONNECT. All rights reserved.</p>
            <p>If you have any questions, reach us at <b>connect@ottosons.com</b>.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        // Send Email
        await transporter.sendMail({
            from: `"Connect" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: "Welcome to Connect!",
            html: emailTemplate,
        });

        return new Response(JSON.stringify({ success: true, message: "Welcome email sent successfully" }), { status: 200 });
    } catch (err) {
        console.error("❌ Welcome email error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
