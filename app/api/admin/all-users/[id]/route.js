import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// Import nodemailer
import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or any SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email sender function with HTML template
async function sendEmail(to, subject, userData, action, reason = "") {
  let actionText = "";
  switch (action) {
    case "suspended":
      actionText = "temporarily suspended";
      break;
    case "unsuspended":
      actionText = "reinstated";
      break;
    case "deleted":
      actionText = "deleted";
      break;
    default:
      actionText = "";
  }

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
          <h2>${subject}</h2>
        </div>

        <p>Hello <b>${userData.fullName || "User"}</b>,</p>

        <p>Your account on <b>Connect</b> has been <b>${actionText}</b>.</p>

        ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ""}

        <p>If you believe this was a mistake or would like to appeal, please contact our support team. We will review your case promptly.</p>

        <div class="footer">
          <p>&copy; 2025 CONNECT. All rights reserved.</p>
          <p>For support or inquiries, contact <b>support@connect.com</b>.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: `Hello ${userData.fullName || "User"}, your account has been ${actionText}.`, // fallback text
      html: emailTemplate,
    });
  } catch (err) {
    console.error("❌ Email send error:", err);
  }
}

// Authenticate JWT
async function authenticate(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Unauthorized: No token provided", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return { error: "Unauthorized: Invalid token", status: 403 };
    }

    return { decoded };
  } catch (err) {
    console.error("JWT error:", err);
    return { error: "Unauthorized: Token error", status: 403 };
  }
}

// GET user
export async function GET(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    return NextResponse.json({
      success: true,
      data: {
        id,
        fullName: userData.fullName || null,
        imageUrl: userData.imageUrl || null,
        role: userData.role || "user",
        location: userData.location || null,
        email: userData.email || null,
        phone: userData.phone || null,
        profileCompleted: userData.profileCompleted || false,
        status: userData.status || "active",
        createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: userData.updatedAt?.toDate?.()?.toISOString?.() || null,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { id } = params;
    if (!id || typeof id !== "string") return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });

    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const userData = userSnap.data();
    if (userData.role === "admin" && auth.decoded.role !== "super-admin") {
      return NextResponse.json({ success: false, message: "Only super-admins can delete admins" }, { status: 403 });
    }

    await deleteDoc(userRef);

    // Send deletion email
    if (userData.email) {
      await sendEmail(userData.email, "Account Deleted", userData, "deleted", "Deleted by administrator");
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH - suspend/unsuspend user
export async function PATCH(req, { params }) {
  try {
    const auth = await authenticate(req);
    if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { id } = params;
    if (!id || typeof id !== "string") return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });

    const body = await req.json();
    const { status, reason } = body; // Add optional reason field
    if (!["active", "suspended"].includes(status)) return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });

    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const userData = userSnap.data();
    if (userData.role === "admin" && auth.decoded.role !== "super-admin") {
      return NextResponse.json({ success: false, message: "Only super-admins can suspend admins" }, { status: 403 });
    }

    const previousStatus = userData.status || "active";
    await updateDoc(userRef, { status });

    // Send email based on status change
    if (userData.email) {
      if (status === "suspended" && previousStatus === "active") {
        await sendEmail(userData.email, "Account Suspended", userData, "suspended", reason || "Policy violation or suspicious activity");
      } else if (status === "active" && previousStatus === "suspended") {
        await sendEmail(userData.email, "Account Unsuspended", userData, "unsuspended", reason || "Issue resolved");
      }
    }

    return NextResponse.json({ success: true, message: `User ${status} successfully` }, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
