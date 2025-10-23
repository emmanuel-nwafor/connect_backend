import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    console.log("📩 Admin fetch all bookings request received");

    // Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
      }
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
    }

    const q = query(collection(db, "allBookings"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(JSON.stringify({ success: true, bookings }), { status: 200 });

  } catch (err) {
    console.error("❌ Admin fetch all bookings error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
