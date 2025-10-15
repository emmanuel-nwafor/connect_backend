import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin"; 
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing Google ID token" }, { status: 400 });
    }

    // Verify the Google ID token using Firebase Admin
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decoded;

    // Check if user already exists in Firestore
    const userRef = doc(db, "users", uid);
    const existingUser = await getDoc(userRef);

    const role = email === "echinecherem729@gmail.com" ? "admin" : "user";

    if (!existingUser.exists()) {
      // Create a new user record
      await setDoc(userRef, {
        email,
        fullName: name || "New User",
        profileImage: picture || null,
        role,
        provider: "google",
        profileCompleted: false,
        createdAt: serverTimestamp(),
      });
    }

    // Create JWT for the client
    const token = jwt.sign(
      { userId: uid, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      message: "Google sign-in successful",
      uid,
      email,
      name,
      token,
      redirect: "/setup",
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
