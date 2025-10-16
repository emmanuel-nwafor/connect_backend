import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    const withdrawalsQuery = query(
      collection(db, "withdrawals"),
      orderBy("createdAt", "desc")
    );
    const withdrawalsSnap = await getDocs(withdrawalsQuery);

    if (withdrawalsSnap.empty) {
      return NextResponse.json({
        success: true,
        withdrawals: [],
        message: "No withdrawal requests found.",
      });
    }

    const withdrawals = [];

    for (const docSnap of withdrawalsSnap.docs) {
      const withdrawal = docSnap.data();
      const userRef = doc(db, "users", withdrawal.userId);
      const userSnap = await getDoc(userRef);

      const user = userSnap.exists()
        ? {
            id: userSnap.id,
            name: userSnap.data().name || "Unknown",
            email: userSnap.data().email || null,
            referralCode: userSnap.data().referralCode || null,
          }
        : null;

      withdrawals.push({
        id: docSnap.id,
        ...withdrawal,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "N/A",
        createdAt: withdrawal.createdAt || null,
      });
    }

    const summary = {
      totalRequests: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === "pending").length,
      approved: withdrawals.filter((w) => w.status === "approved").length,
      rejected: withdrawals.filter((w) => w.status === "rejected").length,
      totalAmount: withdrawals.reduce((acc, w) => acc + (w.amount || 0), 0),
    };

    return NextResponse.json({ success: true, summary, withdrawals });
  } catch (err) {
    console.error("Admin withdrawal requests error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
