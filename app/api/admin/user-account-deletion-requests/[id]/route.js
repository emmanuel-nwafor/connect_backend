// /api/admin/user-account-deletion-request/[id]/route.js
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied. Admins only." }, { status: 403 });
    }

    const requestRef = doc(db, "deletionRequests", id);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return NextResponse.json({ success: false, message: "Request not found." }, { status: 404 });
    }

    const requestData = requestSnap.data();
    const { status: currentStatus, userId, email, fullName } = requestData;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body;
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    if (currentStatus === status) {
      return NextResponse.json({ success: false, message: `Request already ${status}.` }, { status: 400 });
    }

    // --- UPDATE REQUEST STATUS ---
    await updateDoc(requestRef, {
      status,
      reviewedBy: decoded.id || "admin",
      reviewedAt: new Date(),
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
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
        }
        .content {
          margin-top: 25px;
          font-size: 15px;
          line-height: 1.7;
        }
        .content p {
          margin: 12px 0;
        }
        .cta {
          text-align: center;
          margin-top: 35px;
        }
        .cta a {
          background-color: ${status === "approved" ? "#EF5350" : "#42A5F5"};
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
          <h2>${status === "approved" ? "Account Deletion Approved" : "Account Deletion Rejected"}</h2>
        </div>
        <div class="content">
          <p>Hello <b>${fullName || "User"}</b>,</p>
          ${
            status === "approved"
              ? `<p>Your account deletion request has been <b>approved</b>. All your data has been permanently removed.</p>`
              : `<p>Your account deletion request has been <b>rejected</b>. You can continue using your account normally.</p>`
          }
          <p>Regards,<br/>Admin Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Your App. All rights reserved.</p>
          <p>If you have questions, contact us at <b>support@yourapp.com</b>.</p>
        </div>
      </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Admin Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Account Deletion ${status === "approved" ? "Approved" : "Rejected"}`,
      html: emailTemplate,
    });

    // --- DELETE USER IF APPROVED ---
    if (status === "approved") {
      try {
        // Remove user from Firebase Auth
        await deleteUser(await auth.getUser(userId));

        // Remove user from Firestore
        const userDocRef = doc(db, "users", userId);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.error("Error deleting user data:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Request ${status} and email sent successfully.`,
    });
  } catch (err) {
    console.error("Update deletion request error:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}
