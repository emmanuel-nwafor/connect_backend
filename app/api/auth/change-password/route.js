// /api/auth/change-password
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    console.log("Change password request received");

    // Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "No token provided" }),
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "Both old and new passwords are required" }),
        { status: 400 }
      );
    }

    const userId = decoded.userId;

    // Get user data from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const email = userData.email;

    // Re-authenticate before changing password
    const userCredential = await signInWithEmailAndPassword(auth, email, oldPassword);
    const user = userCredential.user;

    // Update password
    await updatePassword(user, newPassword);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);

    let message = "Failed to change password";
    if (error.code === "auth/wrong-password") message = "Incorrect old password";
    else if (error.code === "auth/weak-password") message = "New password is too weak";

    return new Response(JSON.stringify({ success: false, error: message }), { status: 400 });
  }
}
