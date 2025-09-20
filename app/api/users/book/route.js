import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        // 1️⃣ Validate JWT
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

        // 2️⃣ Fetch user from Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const userData = userSnap.data();
        const userEmail = userData.email;
        if (!userEmail) {
            return new Response(JSON.stringify({ success: false, error: "User email not found" }), { status: 400 });
        }

        // 3️⃣ Get lodgeId and amount from body
        const { lodgeId, amount } = await req.json();
        if (!lodgeId || !amount) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), { status: 400 });
        }

        // 4️⃣ Initialize Paystack
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userEmail,
                amount, // amount in kobo
                metadata: { lodgeId },
                callback_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/payment-callback`,
            }),
        });

        const initData = await initRes.json();

        if (!initData.status) {
            return new Response(JSON.stringify({ success: false, error: initData.message || "Paystack init failed" }), { status: 400 });
        }

        // 5️⃣ Return authorization URL to frontend
        return new Response(
            JSON.stringify({ success: true, authorizationUrl: initData.data.authorization_url }),
            { status: 200 }
        );

    } catch (err) {
        console.error("Booking error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
