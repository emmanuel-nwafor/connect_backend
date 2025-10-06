import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
    try {
        console.log("📩 Fetch single booking request received");

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
            console.log("✅ JWT decoded:", decoded);
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

        // Fetch user details (name and email)
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(
                JSON.stringify({ success: false, error: "User not found" }),
                { status: 404 }
            );
        }

        const userData = userSnap.data();

        // Fetch property details (if not already stored in booking)
        let propertyName = bookingData.propertyName || null;
        let propertyImage = bookingData.propertyImage || null;

        if (!propertyName || !propertyImage) {
            try {
                const lodgeRef = doc(db, "lodges", bookingData.lodgeId);
                const lodgeSnap = await getDoc(lodgeRef);

                if (lodgeSnap.exists()) {
                    const lodgeData = lodgeSnap.data();
                    propertyName = lodgeData.title || "N/A";
                    propertyImage = Array.isArray(lodgeData.imageUrls)
                        ? lodgeData.imageUrls[0]
                        : null;
                } else {
                    console.warn("⚠️ Lodge not found for ID:", bookingData.lodgeId);
                }
            } catch (err) {
                console.error("⚠️ Error fetching lodge details:", err);
            }
        }

        // Combine all data
        const combinedData = {
            id: bookingSnap.id,
            ...bookingData,
            userName: userData.fullName || "N/A",
            userEmail: userData.email || "N/A",
            propertyName: propertyName || "N/A",
            propertyImage: propertyImage || null,
        };

        return new Response(
            JSON.stringify({
                success: true,
                booking: combinedData,
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
