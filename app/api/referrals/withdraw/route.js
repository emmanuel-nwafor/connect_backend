import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { accountNumber, bankName } = await req.json();
    if (!accountNumber || !bankName) {
      return NextResponse.json({ success: false, message: "Missing account details" }, { status: 400 });
    }

    // --- FETCH USER ---
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = userSnap.data();
    const MIN_POINTS = 200; // Equivalent to withdrawal eligibility

    if ((user.points || 0) < MIN_POINTS) {
      return NextResponse.json({ success: false, message: `You need at least ${MIN_POINTS} points to withdraw.` }, { status: 400 });
    }

    // --- CREATE WITHDRAWAL RECORD ---
    await addDoc(collection(db, "withdrawals"), {
      userId,
      accountNumber,
      bankName,
      amount: user.earnings || 0,
      points: user.points,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    // --- RESET USER EARNINGS ---
    await setDoc(
      userRef,
      { earnings: 0, points: 0, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully.",
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
