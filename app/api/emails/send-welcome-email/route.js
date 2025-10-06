// /api/emails/send-welcome-email/route.js
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        console.log("📨 Incoming request to /api/emails/send-welcome-email");

        const authHeader = req.headers.get("authorization");
        const body = await req.json();
        console.log("📩 Request body:", body);

        let decoded = null;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
                decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("✅ Token verified:", decoded);
            } catch (err) {
                console.warn("⚠️ Token invalid:", err.message);
            }
        } else {
            console.log("ℹ️ No Authorization header found. Continuing without token...");
        }

        const { userId, email } = body;
        if (!userId && !email) {
            console.warn("❌ Missing both userId and email");
            return new Response(JSON.stringify({ success: false, error: "userId or email is required" }), { status: 400 });
        }

        // Fetch user data either by ID or by email
        let userData = null;
        if (userId) {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                console.warn("❌ User not found by ID:", userId);
                return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
            }
            userData = userSnap.data();
            console.log("✅ User fetched by ID:", userData.email);
        } else if (email) {
            console.log("🔍 Fetching user by email:", email);
            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);
            if (snap.empty) {
                console.warn("❌ No user found with this email:", email);
                return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
            }
            userData = snap.docs[0].data();
            console.log("✅ User fetched by email:", userData.email);
        }

        // Configure mail transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("📧 Preparing to send email to:", userData.email);

        const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0; }
          .container { max-width: 700px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee; }
          h2 { color: #333; }
          p { line-height: 1.6; color: #444; }
          .cta { text-align: center; margin-top: 30px; }
          .cta a { background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Connect!</h2>
          </div>
          <p>Hello <b>${userData.fullName || "User"}</b>,</p>
          <p>We’re thrilled to have you join <b>Connect</b> — your one-stop platform for discovering, booking, and managing lodges and properties with ease.</p>
          <p>Enjoy your stay!</p>
          <div class="cta"><a href="https://connectapp.vercel.app/">Explore Connect</a></div>
          <div class="footer">&copy; 2025 CONNECT. All rights reserved.</div>
        </div>
      </body>
      </html>
    `;

        await transporter.sendMail({
            from: `"Connect" <no-reply@connect.com>`,
            to: userData.email,
            subject: "Welcome to Connect!",
            html: emailTemplate,
        });

        console.log("✅ Welcome email sent to:", userData.email);

        return new Response(JSON.stringify({ success: true, message: "Welcome email sent successfully" }), { status: 200 });
    } catch (err) {
        console.error("❌ Welcome email error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
