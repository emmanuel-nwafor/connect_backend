import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export async function POST(req) {
  try {
    console.log("📩 Recover password request received");

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400 }
      );
    }

    // Send recovery email via Firebase
    await sendPasswordResetEmail(auth, email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password recovery email sent successfully. Please check your inbox.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Recover password error:", error);

    let message = "Failed to send recovery email";
    if (error.code === "auth/user-not-found")
      message = "No account found with that email address";
    else if (error.code === "auth/invalid-email")
      message = "Invalid email address";

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
    });
  }
}
