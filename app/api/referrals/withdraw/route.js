import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
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

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = userSnap.data();
    const MIN_POINTS = 200;
    const POINT_TO_NAIRA = 10;

    if ((user.points || 0) < MIN_POINTS) {
      return NextResponse.json({
        success: false,
        message: `You need at least ${MIN_POINTS} points to withdraw.`,
      }, { status: 400 });
    }

    const withdrawalQuery = query(
      collection(db, "withdrawals"),
      where("userId", "==", userId)
    );
    const withdrawalsSnap = await getDocs(withdrawalQuery);

    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

    const withdrewToday = withdrawalsSnap.docs.some(doc => {
      const createdAt = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
      return createdAt >= startOfDay && createdAt <= endOfDay;
    });

    if (withdrewToday) {
      return NextResponse.json({
        success: false,
        message: "You can only withdraw once per day.",
      }, { status: 400 });
    }

    const totalPoints = user.points || 0;
    const amount = totalPoints * POINT_TO_NAIRA;

    await addDoc(collection(db, "withdrawals"), {
      userId,
      name: user.fullName || "Unknown",
      email: user.email || "Unknown",
      accountNumber,
      bankName,
      amount,
      pointsUsed: totalPoints,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    await setDoc(
      userRef,
      {
        earnings: 0,
        points: 0,
        lastWithdrawalAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: `Withdrawal request of ₦${amount.toFixed(2)} submitted successfully.`,
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}