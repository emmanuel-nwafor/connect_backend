// /api/emails/send-account-suspended-email/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        console.log("📩 Account Suspension Email API triggered");

        const { userId, email, reason } = await req.json();

        if (!userId || !email) {
            return new Response(
                JSON.stringify({ success: false, error: "userId and email are required" }),
                { status: 400 }
            );
        }

        // Fetch user info from Firestore (optional — fallback to provided email)
        console.log("📄 Fetching user from Firestore:", userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        let userData = {};
        if (userSnap.exists()) {
            userData = userSnap.data();
            console.log("✅ User data fetched:", userData.email);
        } else {
            console.log("⚠️ User not found in Firestore, using provided email instead");
            userData.email = email;
        }

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
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0; }
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
              <h2>Account Suspension Notice</h2>
            </div>

            <p>Hello <b>${userData.fullName || "User"}</b>,</p>

            <p>We regret to inform you that your account on <b>Connect</b> has been temporarily suspended.</p>

            <div class="reason">
              <p><b>Reason:</b> ${reason || "Violation of Connect’s community or usage policies."}</p>
            </div>

            <p>At Connect, we are committed to maintaining a trusted platform where users can confidently discover, book, and manage properties. To ensure fairness and security for everyone, accounts may be suspended for reasons such as suspicious activities, policy violations, or misuse of our services.</p>

            <p>If you believe this was a mistake or would like to appeal this decision, kindly contact our support team. We’ll review your case and get back to you as soon as possible.</p>

            <p>We appreciate your understanding and cooperation as we work to keep our community safe and reliable for all users.</p>

            <div class="footer">
              <p>&copy; 2025 CONNECT. All rights reserved.</p>
              <p>For support or inquiries, contact <b>support@connect.com</b>.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        // Send email
        await transporter.sendMail({
            from: `"Connect Support" <${process.env.EMAIL_USER}>`,
            to: userData.email,
            subject: "Account Suspension Notice - Connect",
            html: emailTemplate,
        });

        console.log("✅ Account suspension email sent successfully to:", userData.email);

        return new Response(
            JSON.stringify({ success: true, message: "Account suspension email sent successfully" }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Account suspension email error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
