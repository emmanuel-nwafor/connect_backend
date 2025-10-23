import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        console.log("Booking request received");

        // Validate JWT
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const userId = decoded.userId;

        // Fetch user from Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const userData = userSnap.data();
        const userEmail = userData.email;
        const userFullName = userData.fullName || userData.name || "N/A";

        if (!userEmail) {
            return new Response(JSON.stringify({ success: false, error: "User email not found" }), { status: 400 });
        }

        // Parse request body
        let body;
        try {
            body = await req.json();
        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), { status: 400 });
        }

        const { lodgeId, amount } = body;
        if (!lodgeId || amount == null) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return new Response(JSON.stringify({ success: false, error: "Invalid amount" }), { status: 400 });
        }

        const amountInKobo = Math.round(numericAmount * 100);

        // Fetch property details from lodges collection
        const lodgeRef = doc(db, "lodges", lodgeId);
        const lodgeSnap = await getDoc(lodgeRef);

        if (!lodgeSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Property not found" }), { status: 404 });
        }

        const lodgeData = lodgeSnap.data();
        const propertyName = lodgeData.title || "N/A";
        const propertyImage = Array.isArray(lodgeData.imageUrls) ? lodgeData.imageUrls[0] : null;

        // Determine status based on category
        const category = (lodgeData.category || "others").toLowerCase();
        let newStatus;
        if (category === "houses" || category === "apartment") {
            newStatus = "booked";
        } else if (category === "shop") {
            newStatus = "rented";
        } else if (category === "lands" || category === "others") {
            newStatus = "purchased";
        } else {
            newStatus = "purchased";
        }

        // Update lodge status in Firestore
        await updateDoc(lodgeRef, { status: newStatus });

        // Save booking (include user & property info) to user's own collection
        const bookingRef = await addDoc(collection(db, "users", userId, "bookings"), {
            lodgeId,
            amount: numericAmount,
            status: "pending",
            customerName: userFullName,
            customerEmail: userEmail,
            propertyName,
            propertyImage,
            createdAt: serverTimestamp(),
        });

        console.log("Booking saved in user collection. ID:", bookingRef.id);

        // Save the same booking to 'allBookings' collection for admin access
        await addDoc(collection(db, "allBookings"), {
            bookingId: bookingRef.id,
            userId,
            userName: userFullName,
            userEmail,
            lodgeId,
            amount: numericAmount,
            status: "pending",
            propertyName,
            propertyImage,
            createdAt: serverTimestamp(),
        });

        console.log("Booking also saved in allBookings collection");

        // Initialize Paystack transaction
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
        if (!paystackSecretKey) {
            return new Response(JSON.stringify({ success: false, error: "Paystack secret key missing" }), { status: 500 });
        }

        const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userEmail,
                amount: amountInKobo,
                metadata: { lodgeId, bookingId: bookingRef.id, userId },
                callback_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/payment-callback`,
            }),
        });

        const initData = await initRes.json();
        if (!initData.status) {
            return new Response(JSON.stringify({ success: false, error: initData.message || "Paystack initialization failed" }), { status: 400 });
        }

        return new Response(JSON.stringify({
            success: true,
            authorizationUrl: initData.data.authorization_url,
            bookingId: bookingRef.id,
        }), { status: 200 });

    } catch (err) {
        console.error("Booking error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
