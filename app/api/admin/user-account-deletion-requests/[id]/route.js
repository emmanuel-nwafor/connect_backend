// /api/admin/user-account-deletion-request/[id]/route.js

import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import jwt from "jsonwebtoken";

// --- Email sending setup ---
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req, { params }) {
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

    if (!decoded.role || decoded.role !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
    }

    // Parse request body
    const { status } = await req.json();
    if (!["approved", "rejected"].includes(status)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid status" }), { status: 400 });
    }

    const { id } = params;
    const docRef = doc(db, "deletionRequests", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new Response(JSON.stringify({ success: false, error: "Request not found" }), { status: 404 });
    }

    const requestData = docSnap.data();
    const userEmail = requestData.email;
    const userId = requestData.userId;

    // Update status first
    await updateDoc(docRef, { status });

    // Handle Approved Request
    if (status === "approved") {
      try {
        // Delete user from Firebase Auth
        const auth = getAuth();
        await auth.deleteUser(userId);

        // Delete user's Firestore document
        const userDocRef = doc(db, "users", userId);
        await deleteDoc(userDocRef);

        // Optionally delete related collections (bookings, etc.) if needed

      } catch (deleteErr) {
        console.error("🔥 Error deleting user from Firebase:", deleteErr);
      }
    }

    // --- Email Notification ---
    const emailSubject =
      status === "approved"
        ? "Account Deletion Approved"
        : "Account Deletion Request Rejected";

    const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Poppins', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 700px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          h2 {
            font-weight: 600;
            color: #222;
          }
          p {
            margin: 8px 0;
            font-size: 15px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${emailSubject}</h2>
          ${
            status === "approved"
              ? `
            <p>Hello,</p>
            <p>Your account deletion request has been <strong>approved</strong>.</p>
            <p>All your data and account information have been permanently removed from our system.</p>
            <p>You can no longer access your account.</p>
            <p>We’re sorry to see you go, but wish you all the best.</p>
          `
              : `
            <p>Hello,</p>
            <p>Your account deletion request has been <strong>rejected</strong>.</p>
            <p>If you believe this was a mistake, please contact our support team.</p>
          `
          }
          <div class="footer">
            <p>&copy; 2025 CONNECT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"CONNECT Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: emailSubject,
      html: emailTemplate,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Request handled and user notified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Update deletion request error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
