import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch bookings for this user, ordered by creation date descending
    const bookingsRef = collection(db, "users", userId, "bookings");
    const snapshot = await getDocs(query(bookingsRef, orderBy("createdAt", "desc")));

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore timestamp to human-readable format
      const createdAtFormatted = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })
        : "";

      return {
        id: doc.id,
        lodgeId: data.lodgeId,
        amount: data.amount,
        status: data.status,
        createdAtFormatted,
      };
    });

    return new Response(JSON.stringify({ success: true, bookings }), { status: 200 });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
