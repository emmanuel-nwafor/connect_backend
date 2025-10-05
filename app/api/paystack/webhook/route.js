import { db } from "@/lib/firebase";
import crypto from "crypto";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import fetch from "node-fetch"; // if needed for calling your email API

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
            const { bookingId, userId } = metadata;

            if (bookingId && userId && status === "success") {
                const bookingRef = doc(db, "users", userId, "bookings", bookingId);

                // 4️⃣ Update booking status
                await updateDoc(bookingRef, {
                    status: "success",
                    updatedAt: new Date(),
                    reference,
                });

                console.log("✅ Booking updated in Firestore:", bookingId);

                // 5️⃣ Fetch user info for notifications and email
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                const userName = userData.fullName || "User";
                const userEmail = userData.email;

                // 6️⃣ Add notifications for admin and user
                await addDoc(collection(db, "notifications"), {
                    title: "New Booking",
                    message: `${userName} booked a lodge ${bookingId}.`,
                    role: "admin",
                    userId: null,
                    type: "booking",
                    bookingId,
                    createdAt: serverTimestamp(),
                });

                await addDoc(collection(db, "notifications"), {
                    title: "Booking Confirmed",
                    message: `You booked a lodge ${bookingId}.`,
                    role: "user",
                    userId,
                    type: "booking",
                    bookingId,
                    createdAt: serverTimestamp(),
                });

                // 7️⃣ Call your booking email API
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/emails/send-booking-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bookingId, userId }),
                    });
                    console.log("✅ Booking email sent");
                } catch (emailErr) {
                    console.error("❌ Error sending booking email:", emailErr);
                }
            }
        }

        return new Response("Webhook processed", { status: 200 });
    } catch (err) {
        console.error("❌ Webhook error:", err);
        return new Response("Server error", { status: 500 });
    }
}
