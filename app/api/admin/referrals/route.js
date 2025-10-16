import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Restrict to admin
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // --- FETCH ALL USERS ---
    const usersSnap = await getDocs(query(collection(db, "users")));
    const users = usersSnap.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || null,
      email: doc.data().email || null,
      referralCode: doc.data().referralCode || null,
      referredBy: doc.data().referredBy || null,
      referredUsers: doc.data().referredUsers || [],
      referralsCount: doc.data().referrals || 0,
      points: doc.data().points || 0,
      earnings: doc.data().earnings || 0,
      createdAt: doc.data().createdAt || null,
      updatedAt: doc.data().updatedAt || null,
    }));

    // --- BUILD REFERRAL RELATIONSHIPS ---
    const referralData = [];

    for (const user of users) {
      // Who this user referred
      const referredList = users.filter(
        (u) => u.referredBy && u.referredBy === user.referralCode
      );

      referralData.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        referredBy: user.referredBy
          ? users.find((u) => u.referralCode === user.referredBy)?.name || null
          : null,
        referredByEmail: user.referredBy
          ? users.find((u) => u.referralCode === user.referredBy)?.email || null
          : null,
        totalReferrals: referredList.length,
        referredUsers: referredList.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          referralCode: r.referralCode,
        })),
        points: user.points,
        earnings: user.earnings,
        createdAt: user.createdAt,
      });
    }

    // --- OPTIONAL: REFERRAL LOGS ---
    let logs = [];
    try {
      const logsSnap = await getDocs(
        query(collection(db, "notifications"), orderBy("createdAt", "desc"))
      );
      logs = logsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch {
      logs = [];
    }

    // --- SUMMARY ---
    const totalReferrals = referralData.reduce(
      (acc, u) => acc + u.totalReferrals,
      0
    );
    const totalEarnings = referralData.reduce(
      (acc, u) => acc + (u.earnings || 0),
      0
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        totalReferrals,
        totalEarnings,
      },
      data: referralData,
      logs,
    });
  } catch (err) {
    console.error("Admin referrals error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
