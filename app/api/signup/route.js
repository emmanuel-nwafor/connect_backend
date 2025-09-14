import { auth, createUserWithEmailAndPassword, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Determine role
    const role = email === "echinecherem729@gmail.com" ? "admin" : "user";

    // Create Firestore doc with isFirstTime
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role,
      isFirstTime: role === "admin" ? false : true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "User created successfully", uid: user.uid, role }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
