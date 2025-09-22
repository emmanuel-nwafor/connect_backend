// /api/paystack/webhook/route.js
import { db } from "@/lib/firebase";
import crypto from "crypto";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req) {
    try {
        // 1️⃣ Read raw request body
        const body = await req.text();

        // 2️⃣ Verify Paystack signature
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
        const signature = req.headers.get("x-paystack-signature");

        if (hash !== signature) {
            console.error("❌ Invalid Paystack signature");
            return new Response("Invalid signature", { status: 401 });
        }

        // 3️⃣ Parse event data
        const event = JSON.parse(body);
        console.log("📌 Paystack webhook event:", event);

        if (event.event === "charge.success") {
            const { metadata, status, reference } = event.data;
            const { bookingId, userId } = metadata; // ✅ we’ll store both in metadata

            if (bookingId && userId) {
                const bookingRef = doc(db, "users", userId, "bookings", bookingId);

                await updateDoc(bookingRef, {
                    status: status === "success" ? "success" : "failed",
                    updatedAt: new Date(),
                    reference,
                });

                console.log("✅ Booking updated in Firestore:", bookingId);
            }
        }

        return new Response("Webhook processed", { status: 200 });
    } catch (err) {
        console.error("❌ Webhook error:", err);
        return new Response("Server error", { status: 500 });
    }
}
