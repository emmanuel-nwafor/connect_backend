import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    console.log("📨 Incoming request to /api/emails/send-withdrawal-rejected");

    // const authHeader = req.headers.get("authorization");
    const body = await req.json();
    console.log("📩 Request body:", body);

    // --- VERIFY TOKEN ---
    // let decoded = null;
    // if (authHeader?.startsWith("Bearer ")) {
    //   try {
    //     const token = authHeader.split(" ")[1];
    //     decoded = jwt.verify(token, process.env.JWT_SECRET);
    //     console.log("Token verified:", decoded);
    //   } catch (err) {
    //     console.warn("Invalid token:", err.message);
    //     return new Response(
    //       JSON.stringify({ success: false, message: "Invalid token" }),
    //       { status: 401 }
    //     );
    //   }
    // } else {
    //   return new Response(
    //     JSON.stringify({ success: false, message: "Missing authorization" }),
    //     { status: 401 }
    //   );
    // }

    const { userId, email, reason } = body;
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ success: false, error: "userId or email is required" }),
        { status: 400 }
      );
    }

    // --- FETCH USER ---
    let userData = null;
    if (userId) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404 }
        );
      }
      userData = userSnap.data();
    } else {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (snap.empty) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404 }
        );
      }
      userData = snap.docs[0].data();
    }

    console.log("👤 User found:", { id: userId || userData.id, email: userData.email });

    // --- MAIL TRANSPORTER ---
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    // Verify transporter connection
    await transporter.verify();
    console.log("✅ Transporter verified successfully");

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
                .rejected {
                color: #EF4444;
                }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Connect Logo" />
                <h2 class="rejected">Withdrawal Request Rejected</h2>
                </div>

                <div class="content">
                <p>Hello <b>${userData.name || userData.email || "User"}</b>,</p>

                <p>We're sorry to inform you that your recent withdrawal request has been rejected.</p>
                ${
                  reason
                    ? `<p><b>Reason:</b> ${reason}</p>`
                    : `<p>Please ensure your bank details are correct and try again later.</p>`
                }
                <p>You can submit a new withdrawal request after reviewing your information.</p>

                <ol>
                    <li>Check your bank details for accuracy.</li>
                    <li>Ensure your account is verified.</li>
                    <li>Contact support if you need assistance.</li>
                </ol>
                </div>

                <div class="footer">
                <p>&copy; 2025 CONNECT. All rights reserved.</p>
                <p>If you have any questions, contact us at <b>connect.lodge@gmail.com</b> or reply to this email.</p>
                </div>
            </div>
            </body>
            </html>
        `;

    const mailOptions = {
      from: `"Connect" <${process.env.EMAIL_USER}>`,
      to: userData.email,
      subject: "Withdrawal Rejected – Connect",
      html: emailTemplate,
    };

    console.log("📧 Sending email to:", userData.email);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully. Message ID:", info.messageId);

    return new Response(
      JSON.stringify({ success: true, message: "Rejection email sent successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Withdrawal rejection email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}