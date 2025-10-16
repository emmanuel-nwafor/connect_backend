import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: enforce admin-only access
    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    // --- FETCH USERS REFERRAL DATA ---
    const usersQuery = query(collection(db, "users"));
    const usersSnap = await getDocs(usersQuery);
    const users = usersSnap.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email || null,
      referralCode: doc.data().referralCode || null,
      referredBy: doc.data().referredBy || null,
      referrals: doc.data().referrals || 0,
      points: doc.data().points || 0,
      earnings: doc.data().earnings || 0,
      referredUsers: doc.data().referredUsers || [],
      createdAt: doc.data().createdAt || null,
      updatedAt: doc.data().updatedAt || null,
    }));

    // --- FETCH WITHDRAWAL REQUESTS ---
    const withdrawalsQuery = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
    const withdrawalsSnap = await getDocs(withdrawalsQuery);
    const withdrawals = withdrawalsSnap.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      accountNumber: doc.data().accountNumber,
      bankName: doc.data().bankName,
      amount: doc.data().amount,
      points: doc.data().points,
      status: doc.data().status,
      createdAt: doc.data().createdAt,
    }));

    // --- FETCH NOTIFICATIONS / REFERRAL LOGS (OPTIONAL) ---
    let logs = [];
    try {
      const logsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
      const logsSnap = await getDocs(logsQuery);
      logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch {
      logs = [];
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        totalWithdrawals: withdrawals.length,
        totalReferrals: users.reduce((acc, u) => acc + (u.referrals || 0), 0),
        totalEarnings: users.reduce((acc, u) => acc + (u.earnings || 0), 0),
      },
      data: {
        users,
        withdrawals,
        logs,
      },
    });
  } catch (err) {
    console.error("Admin referrals error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
