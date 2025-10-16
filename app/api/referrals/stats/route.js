import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid user" },
        { status: 401 }
      );
    }

    // User fetch
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = userSnap.data();

    // Earning Logic
    const POINT_VALUE = 5; // ₦5 per point
    const points = user.points || 0;
    const earnings = points * POINT_VALUE;

    // You can log user IP/device on login or referral usage
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    const device = req.headers.get("user-agent") || "unknown-device";

    // Check if multiple users share same IP
    const usersRef = collection(db, "users");
    const ipQuery = query(usersRef, where("lastIp", "==", ip));
    const ipSnap = await getDocs(ipQuery);

    // Check if the same account is from the same IP
    let suspicious = false;
    if (ipSnap.size > 3) {
      suspicious = true;
    }

    const profileCompleted = user.profileCompleted || false;
    if (!profileCompleted) {
      console.warn(`User ${userId} has not completed profile yet.`);
    }

    // Response
    return NextResponse.json({
      success: true,
      code: user.referralCode || null,
      stats: {
        referrals: user.referrals || 0,
        points,
        earnings,
      },
      antiExploit: {
        suspicious,
        ip,
        device,
        profileCompleted,
      },
    });
  } catch (error) {
    console.error("Referral stats error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
