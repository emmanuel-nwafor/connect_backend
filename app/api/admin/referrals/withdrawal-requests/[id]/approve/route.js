// /api/admin/referrals/withdrawal-requests/[id]/approve
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

    const withdrawalRef = doc(db, "withdrawals", id);
    const withdrawalSnap = await getDoc(withdrawalRef);

    if (!withdrawalSnap.exists()) {
      return NextResponse.json({ success: false, message: "Withdrawal not found." }, { status: 404 });
    }

    const withdrawal = withdrawalSnap.data();
    if (withdrawal.status === "approved") {
      return NextResponse.json({ success: false, message: "Already approved." }, { status: 400 });
    }
    if (withdrawal.status === "rejected") {
      return NextResponse.json({ success: false, message: "Cannot approve a rejected request." }, { status: 400 });
    }

    // --- UPDATE STATUS ---
    await updateDoc(withdrawalRef, {
      status: "approved",
      approvedBy: decoded.id || "admin",
      approvedAt: new Date(),
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
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10B981;">Withdrawal Approved</h2>
        <p>Hello <b>${withdrawal.name || "User"}</b>,</p>
        <p>Your withdrawal of <b>₦${withdrawal.amount?.toLocaleString()}</b> has been approved and processed successfully.</p>
        <p>You should receive the funds shortly. If not, please contact support.</p>
        <p style="font-size: 12px; color: gray;">© 2025 Connect. All rights reserved.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Connect" <${process.env.EMAIL_USER}>`,
      to: withdrawal.email,
      subject: "Withdrawal Approved – Connect",
      html: emailTemplate,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal approved and email sent successfully.",
    });
  } catch (err) {
    console.error("Approve withdrawal error:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}
