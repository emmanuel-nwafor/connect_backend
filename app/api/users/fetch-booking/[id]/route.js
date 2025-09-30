// /api/users/fetch-booking/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
    try {
        console.log("Fetch single booking request received");

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
            console.log("JWT decoded:", decoded);
        } catch (err) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid token" }),
                { status: 401 }
            );
        }

        const userId = decoded.userId;
        const bookingId = params.id;

        // Fetch booking from Firestore
        const bookingRef = doc(db, "users", userId, "bookings", bookingId);
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
                booking: {
                    id: bookingSnap.id,
                    ...bookingData,
                },
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Fetch booking error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
