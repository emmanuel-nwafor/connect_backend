// app/api/users/check-user/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid"); // Client sends UID

  if (!uid) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing UID" }),
      { status: 400 }
    );
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          data: userSnap.data(),
          skipOnboarding: true,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          exists: false,
          skipOnboarding: false,
        }),
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Check user error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
