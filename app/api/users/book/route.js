import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        console.log("📌 Booking request received");

        // 1️⃣ Validate JWT
        const authHeader = req.headers.get("authorization");
        console.log("Authorization header:", authHeader);

        if (!authHeader?.startsWith("Bearer ")) {
            console.warn("❌ No token provided");
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("✅ JWT decoded successfully:", decoded);
        } catch (err) {
            console.error("❌ JWT verification failed:", err);
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const userId = decoded.userId;
        console.log("User ID from token:", userId);

        // 2️⃣ Fetch user from Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        console.log("Firestore user snapshot:", userSnap.exists());

        if (!userSnap.exists()) {
            console.warn("❌ User not found in Firestore");
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const userData = userSnap.data();
        const userEmail = userData.email;
        console.log("User email:", userEmail);

        if (!userEmail) {
            console.warn("❌ User email missing in Firestore document");
            return new Response(JSON.stringify({ success: false, error: "User email not found" }), { status: 400 });
        }

        // 3️⃣ Get lodgeId and amount from request body
        let body;
        try {
            body = await req.json();
            console.log("Request body:", body);
        } catch (err) {
            console.error("❌ Failed to parse request body:", err);
            return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), { status: 400 });
        }

        const { lodgeId, amount } = body;
        if (!lodgeId || !amount) {
            console.warn("❌ Missing lodgeId or amount");
            return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
        }

        // Convert amount to kobo
        const amountInKobo = amount * 100;
        console.log("Amount in kobo:", amountInKobo);

        // 4️⃣ Initialize Paystack transaction
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        console.log("Initializing Paystack transaction...");

        let initRes;
        try {
            initRes = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userEmail,
                    amount: amountInKobo,
                    metadata: { lodgeId },
                    // callback_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/payment-callback`,
                }),
            });
        } catch (err) {
            console.error("❌ Paystack request failed:", err);
            return new Response(JSON.stringify({ success: false, error: "Paystack request failed" }), { status: 500 });
        }

        const initData = await initRes.json();
        console.log("Paystack response:", initData);

        if (!initData.status) {
            console.warn("❌ Paystack initialization failed:", initData.message);
            return new Response(JSON.stringify({ success: false, error: initData.message || "Paystack init failed" }), { status: 400 });
        }

        // 5️⃣ Return authorization URL to frontend
        console.log("✅ Booking initialized, sending authorization URL");
        return new Response(
            JSON.stringify({ success: true, authorizationUrl: initData.data.authorization_url }),
            { status: 200 }
        );

    } catch (err) {
        console.error("❌ Booking error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
