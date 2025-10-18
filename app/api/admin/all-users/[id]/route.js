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
async function sendEmail(to, subject, message) {
  const htmlTemplate = `
    <div style="font-family: Poppins, sans-serif; color: #333;">
      <div style="text-align:center; margin-bottom:20px;">
        <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757033773/connect-image-logo_obunnv.png" alt="App Logo" width="100" />
      </div>
      <h2 style="text-align:center; color:#007AFF;">${subject}</h2>
      <p style="text-align:center; font-size:16px;">${message}</p>
      <p style="text-align:center; font-size:14px; color:#666;">If you have questions, please contact our support team.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: message, // fallback text
      html: htmlTemplate,
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
      await sendEmail(userData.email, "Account Deleted", "Your account has been deleted by an administrator.");
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
    const { status } = body;
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

    if (userData.email) {
      if (status === "suspended" && previousStatus === "active") {
        await sendEmail(userData.email, "Account Suspended", "Your account has been suspended by an administrator.");
      } else if (status === "active" && previousStatus === "suspended") {
        await sendEmail(userData.email, "Account Unsuspended", "Your account has been unsuspended by an administrator.");
      }
    }

    return NextResponse.json({ success: true, message: `User ${status} successfully` }, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
