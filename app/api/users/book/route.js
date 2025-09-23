// /api/users/book
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        console.log("📌 Booking request received");

        // 1️⃣ Validate JWT
        const authHeader = req.headers.get("authorization");
        console.log("Authorization header:", authHeader);

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

        // 2️⃣ Fetch user from Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(
                JSON.stringify({ success: false, error: "User not found" }),
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        const userEmail = userData.email;

        if (!userEmail) {
            return new Response(
                JSON.stringify({ success: false, error: "User email not found" }),
                { status: 400 }
            );
        }

        // 3️⃣ Parse request body
        let body;
        try {
            body = await req.json();
        } catch (err) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid JSON body" }),
                { status: 400 }
            );
        }

        const { lodgeId, amount } = body;
        if (!lodgeId || amount == null) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400 }
            );
        }

        // Validate amount
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid amount" }),
                { status: 400 }
            );
        }

        const amountInKobo = Math.round(numericAmount * 100);
        console.log("Amount in kobo:", amountInKobo);

        // 4️⃣ Save booking to Firestore before initializing Paystack
        const bookingRef = await addDoc(
            collection(db, "users", userId, "bookings"),
            {
                lodgeId,
                amount: numericAmount,
                status: "pending", // until Paystack confirms
                createdAt: serverTimestamp(),
            }
        );

        console.log("✅ Booking saved to Firestore with ID:", bookingRef.id);

        // 5️⃣ Initialize Paystack transaction
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
        if (!paystackSecretKey) {
            return new Response(
                JSON.stringify({ success: false, error: "Paystack secret key missing" }),
                { status: 500 }
            );
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
                metadata: {
                    lodgeId,
                    bookingId: bookingRef.id,
                    userId, // ✅ Added userId for webhook
                },
                callback_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/payment-callback`,
            }),
        });

        const initData = await initRes.json();
        console.log("Paystack response:", initData);

        if (!initData.status) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: initData.message || "Paystack init failed",
                }),
                { status: 400 }
            );
        }

        // 6️⃣ Return authorization URL + bookingId
        return new Response(
            JSON.stringify({
                success: true,
                authorizationUrl: initData.data.authorization_url,
                bookingId: bookingRef.id,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Booking error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
