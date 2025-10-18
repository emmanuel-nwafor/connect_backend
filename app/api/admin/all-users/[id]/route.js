// /api/admin/all-users/[id]/route.js
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

// Email transporter
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_FROM = process.env.EMAIL_FROM;

// Send email function
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Email send error:", error);
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
    const email = userData.email;

    // Prevent admins from deleting admins
    if (userData.role === "admin" && auth.decoded.role !== "super-admin") {
      return NextResponse.json(
        { success: false, message: "Only super-admins can delete admins" },
        { status: 403 }
      );
    }

    await deleteDoc(userRef);

    // Send deletion email
    if (email) {
      await sendEmail(
        email,
        "Account Deleted",
        "Your account has been deleted by an administrator."
      );
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
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const { id } = params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!["active", "suspended"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    const previousStatus = userData.status || "active";
    const email = userData.email;

    // Prevent admins from suspending admins unless super-admin
    if (userData.role === "admin" && auth.decoded.role !== "super-admin") {
      return NextResponse.json(
        { success: false, message: "Only super-admins can suspend admins" },
        { status: 403 }
      );
    }

    await updateDoc(userRef, { status });

    // Send email based on status change
    if (email) {
      if (status === "suspended" && previousStatus === "active") {
        await sendEmail(
          email,
          "Account Suspended",
          "Your account has been suspended by an administrator."
        );
      } else if (status === "active" && previousStatus === "suspended") {
        await sendEmail(
          email,
          "Account Unsuspended",
          "Your account has been unsuspended by an administrator."
        );
      }
    }

    return NextResponse.json({ success: true, message: `User ${status} successfully` }, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}