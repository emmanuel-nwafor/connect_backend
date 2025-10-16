import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid user" }, { status: 401 });
    }

    // --- FETCH USER ---
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = userSnap.data();

    return NextResponse.json({
      success: true,
      code: user.referralCode || null,
      stats: {
        referrals: user.referrals || 0,
        points: user.points || 0,
        earnings: user.earnings || 0,
      },
    });
  } catch (error) {
    console.error("Referral stats error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
