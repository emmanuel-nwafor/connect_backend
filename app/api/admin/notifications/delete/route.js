import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function DELETE(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // --- CHECK IF USER IS ADMIN ---
    if (decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admins only" }, { status: 403 });
    }

    // --- FETCH ALL ADMIN NOTIFICATIONS ---
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("role", "==", "admin"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "No notifications to delete." });
    }

    // --- DELETE EACH NOTIFICATION ---
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "notifications", docSnap.id))
    );
    await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      message: "All admin notifications deleted successfully.",
    });
  } catch (err) {
    console.error("Delete admin notifications error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
