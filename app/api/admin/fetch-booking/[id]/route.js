// app/api/admin/bookings/[id]/route.js  (or your actual path)

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    console.log("📩 Admin fetch single booking request received");

    // Safely access params
    const bookingId = params?.id;

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing booking ID" }),
        { status: 400 }
      );
    }

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
      if (decoded.role !== "admin") {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Admin only" }),
          { status: 403 }
        );
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401 }
      );
    }

    // Fetch booking
    const bookingRef = doc(db, "allBookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found" }),
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();

    return new Response(
      JSON.stringify({
        success: true,
        booking: { id: bookingSnap.id, ...bookingData },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Admin fetch single booking error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}