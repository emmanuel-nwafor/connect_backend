// pages/api/users/fetch-booking/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    const userId = decoded.userId;

    // Fetch all bookings for this user, ordered by creation date descending
    const bookingsRef = collection(db, "users", userId, "bookings");
    const q = query(bookingsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore timestamp to human-readable format
      let createdAtFormatted = "";
      if (data.createdAt?.toDate) {
        const date = data.createdAt.toDate();
        const options = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric" };
        createdAtFormatted = date.toLocaleString("en-US", options);
      }

      return {
        id: doc.id,
        lodgeId: data.lodgeId,
        amount: data.amount,
        status: data.status,
        createdAtFormatted,
      };
    });

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    console.error("❌ Fetch bookings error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
