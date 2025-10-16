import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  try {
    const { id } = params;

    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- ROLE VALIDATION ---
    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied. Admins only." }, { status: 403 });
    }

    // --- FIND WITHDRAWAL REQUEST ---
    const withdrawalRef = doc(db, "withdrawals", id);
    const withdrawalSnap = await getDoc(withdrawalRef);

    if (!withdrawalSnap.exists()) {
      return NextResponse.json({ success: false, message: "Withdrawal request not found." }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      message: "Withdrawal request approved successfully.",
    });
  } catch (err) {
    console.error("Approve withdrawal error:", err);
    if (err.name === "JsonWebTokenError") {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
