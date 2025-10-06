// /api/paystack/webhook/route.js
import { db } from "@/lib/firebase";
import crypto from "crypto";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

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
            const { bookingId, userId, lodgeId } = metadata;

            if (bookingId && userId) {
                const bookingRef = doc(db, "users", userId, "bookings", bookingId);

                // 4️⃣ Update booking status
                await updateDoc(bookingRef, {
                    status: status === "success" ? "success" : "failed",
                    updatedAt: new Date(),
                    reference,
                });
                console.log("✅ Booking updated in Firestore:", bookingId);

                // 5️⃣ Fetch user info
                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? userSnap.data() : {};
                const userEmail = userData.email;
                const userName = userData.fullName || "User";

                // 6️⃣ Create notifications only if success
                if (status === "success") {
                    // Admin notification
                    await addDoc(collection(db, "notifications"), {
                        title: "New Booking",
                        message: `${userName} booked a lodge.`,
                        role: "admin",
                        userId: null,
                        type: "booking",
                        bookingId,
                        createdAt: serverTimestamp(),
                    });

                    // User notification
                    await addDoc(collection(db, "notifications"), {
                        title: "Booking Confirmed",
                        message: `You successfully booked a lodge.`,
                        role: "user",
                        userId,
                        type: "booking",
                        bookingId,
                        createdAt: serverTimestamp(),
                    });

                    // 7️⃣ Generate JWT token for internal API call
                    const token = jwt.sign(
                        { userId },
                        process.env.JWT_SECRET,
                        { expiresIn: "1h" }
                    );

                    // 8️⃣ Call booking email API
                    if (userEmail) {
                        try {
                            const emailRes = await fetch(
                                `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/emails/send-booking-email`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ bookingId, userId, lodgeId }),
                                }
                            );
                            const emailData = await emailRes.json();
                            console.log("📧 Booking email sent:", emailData);
                        } catch (err) {
                            console.error("❌ Failed to send booking email:", err);
                        }
                    }
                }
            }
        }

        return new Response("Webhook processed", { status: 200 });
    } catch (err) {
        console.error("❌ Webhook error:", err);
        return new Response("Server error", { status: 500 });
    }
}
