// /api/admin/referrals/withdrawal-requests/[id]/reject
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admins only" }, { status: 403 });
    }

    const withdrawalRef = doc(db, "withdrawals", id);
    const withdrawalSnap = await getDoc(withdrawalRef);

    if (!withdrawalSnap.exists()) {
      return NextResponse.json({ success: false, message: "Withdrawal not found." }, { status: 404 });
    }

    const withdrawal = withdrawalSnap.data();
    if (withdrawal.status === "rejected") {
      return NextResponse.json({ success: false, message: "Already rejected." }, { status: 400 });
    }

    if (withdrawal.status === "approved") {
      return NextResponse.json({ success: false, message: "Cannot reject an approved request." }, { status: 400 });
    }

    // --- UPDATE STATUS ---
    await updateDoc(withdrawalRef, {
      status: "rejected",
      rejectedBy: decoded.id || "admin",
      rejectedAt: new Date(),
    });

    // --- SEND EMAIL ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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
        .content ul, .content ol {
          margin: 10px 0 10px 20px;
        }
        .cta {
          text-align: center;
          margin-top: 35px;
        }
        .cta a {
          background-color: #EF4444;
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

          <p>We regret to inform you that your withdrawal request of <b>₦${amount?.toLocaleString() || "N/A"}</b> has been <b>rejected</b>.</p>

          <p><b>Reason:</b> ${reason || "No reason specified"}.</p>

          <p>If you believe this was an error or wish to clarify, please contact our support team.</p>

          <ol>
            <li>Double-check your withdrawal details and bank information.</li>
            <li>Ensure your referral earnings meet the withdrawal threshold.</li>
            <li>Reach out to support for further assistance.</li>
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

    await transporter.sendMail({
      from: `"Connect" <${process.env.EMAIL_USER}>`,
      to: withdrawal.email,
      subject: "Withdrawal Rejected – Connect",
      html: emailTemplate,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal rejected and email sent successfully.",
    });
  } catch (err) {
    console.error("Reject withdrawal error:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}
