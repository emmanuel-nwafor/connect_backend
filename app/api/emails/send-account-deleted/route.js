// /api/emails/send-account-deletion-email/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        console.log("📩 Account Deletion Email API triggered");

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            console.log("❌ No token provided");
            return new Response(
                JSON.stringify({ success: false, error: "No token provided" }),
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("✅ Token verified:", decoded);
        } catch (err) {
            console.log("❌ Invalid token:", err.message);
            return new Response(
                JSON.stringify({ success: false, error: "Invalid token" }),
                { status: 401 }
            );
        }

        const { userId, reason } = await req.json();
        if (!userId) {
            console.log("❌ userId missing in request body");
            return new Response(
                JSON.stringify({ success: false, error: "userId is required" }),
                { status: 400 }
            );
        }

        if (decoded.userId !== userId) {
            console.log("❌ Unauthorized request: token mismatch");
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized request" }),
                { status: 403 }
            );
        }

        // Fetch user info
        console.log("📄 Fetching user from Firestore:", userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.log("❌ User not found in database");
            return new Response(
                JSON.stringify({ success: false, error: "User not found" }),
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        console.log("✅ User data fetched:", userData.email);

        // Setup email transporter
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
        <style>
          body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin:0; padding:0; }
          .container { max-width: 700px; margin: 30px auto; background: #fff; padding: 25px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; }
          .header img { max-width: 150px; margin-bottom: 10px; }
          h2 { color: #d93025; }
          p { line-height: 1.6; color: #444; font-size: 15px; }
          .reason { background: #fce8e6; padding: 12px; border-left: 4px solid #d93025; margin: 15px 0; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Connect Logo">
            <h2>Account Deletion Notice</h2>
          </div>

          <p>Hello <b>${userData.fullName || "User"}</b>,</p>

          <p>This message is to confirm that your account on <b>Connect</b> has been permanently deleted.</p>

          <div class="reason">
            <p><b>Reason:</b> ${reason || "Requested account deletion or violation of Connect’s usage policy."}</p>
          </div>

          <p>At <b>Connect</b>, we respect your privacy and data rights. As part of our data protection commitment, all personal information associated with your account — including booking history and saved listings — has been securely erased from our systems.</p>

          <p>We’re sorry to see you go. Connect was built to make student accommodation simple, transparent, and affordable — connecting students directly to verified lodges and properties without third-party agency fees.</p>

          <p>If you’d like to rejoin our platform in the future, you’re always welcome to create a new account and continue enjoying a stress-free property search experience.</p>

          <p>Thank you for being a part of the Connect community.</p>

          <div class="footer">
            <p>&copy; 2025 CONNECT. All rights reserved.</p>
            <p>For inquiries, contact <b>Connect-Support@gmail.com</b>.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        // Send email
        await transporter.sendMail({
            from: `"Connect Support" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: "Account Deletion Confirmation - Connect",
            html: emailTemplate,
        });

        console.log("✅ Account deletion email sent successfully to:", userData.email);

        return new Response(
            JSON.stringify({ success: true, message: "Account deletion email sent successfully" }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Account deletion email error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
