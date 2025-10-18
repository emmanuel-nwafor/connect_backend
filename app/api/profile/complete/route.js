// /api/profile/complete
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// Handle GET — check completion and include role
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userRef = doc(db, "users", decoded.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    return NextResponse.json({
      success: true,
      profileCompleted: !!userData.profileCompleted,
      role: userData.role || "user",
      status: userData.status,
    });
  } catch (err) {
    console.error("GET profile check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Keep your POST for updates
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const body = await req.json();
    const { fullName, phone, location, imageUrl } = body;

    if (!fullName || !phone || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await setDoc(
      userRef,
      {
        fullName,
        phone,
        location,
        imageUrl: imageUrl || null,
        profileCompleted: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully",
    });
  } catch (err) {
    console.error("Profile completion error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
