import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing Google ID token" }, { status: 400 });
    }

    // Verify Google token using Firebase Admin SDK
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    // Check if user exists in Firestore
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Account not found. Please sign up first." },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    //  Create a fresh JWT for session management
    const token = jwt.sign(
      { userId: uid, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Successful login response
    return NextResponse.json({
      message: "Google login successful",
      uid,
      email,
      name: userData.fullName || name,
      token,
      redirect: "/users",
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
