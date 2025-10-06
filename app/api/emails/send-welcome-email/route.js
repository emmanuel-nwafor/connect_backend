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
                body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                color: #333;
                }
                .container {
                max-width: 700px;
                margin: 30px auto;
                background: #ffffff;
                padding: 30px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .header {
                text-align: center;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
                }
                .header img {
                max-width: 150px;
                margin-bottom: 10px;
                }
                .content {
                margin-top: 25px;
                font-size: 15px;
                line-height: 1.7;
                }
                .content p {
                margin: 12px 0;
                }
                .content ul {
                margin: 10px 0 10px 20px;
                }
                .cta {
                text-align: center;
                margin-top: 35px;
                }
                .cta a {
                background-color: #2563eb;
                color: white;
                padding: 12px 28px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                font-size: 15px;
                display: inline-block;
                }
                .footer {
                text-align: center;
                font-size: 12px;
                color: #777;
                margin-top: 35px;
                padding-top: 15px;
                border-top: 1px solid #eee;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Connect Logo" />
                <h2>Welcome to Connect!</h2>
                </div>

                <div class="content">
                <p>Hello <b>${userData.email || "User"}</b>,</p>

                <p>We’re absolutely delighted to have you on board with <b>Connect</b> — a platform built to revolutionize how students and tenants discover and secure accommodations.</p>

                <p>At Connect, we believe finding a place to stay shouldn’t be stressful or overpriced. That’s why we’ve created a transparent, user-friendly, and affordable way to connect you directly to verified property owners — eliminating the need for third-party agents and unnecessary fees.</p>

                <p>Here’s what you can do with Connect:</p>
                <ul>
                    <li>Discover verified lodges, apartments, and shops around your school or location.</li>
                    <li>Book your preferred property instantly and pay securely online.</li>
                    <li>Stay updated on your bookings and manage your payments with ease.</li>
                    <li>Enjoy peace of mind knowing that all listings are real, safe, and student-friendly.</li>
                </ul>

                <p>Our mission is simple — to make accommodation accessible, affordable, and stress-free for everyone, starting with students.</p>
                <p>Welcome once again, and thank you for trusting Connect. Let’s make your next stay the best one yet!</p>
                </div>

                <div class="cta">
                <a href="https://connect.vercel.app/">Explore Connect</a>
                </div>

                <div class="footer">
                <p>&copy; 2025 CONNECT. All rights reserved.</p>
                <p>If you have any questions, contact us at <b>connect.lodge@gmail.com</b> or reply to this email.</p>
                </div>
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
