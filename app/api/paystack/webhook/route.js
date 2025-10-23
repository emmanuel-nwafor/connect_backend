import { db } from "@/lib/firebase";
import crypto from "crypto";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    // Read raw request body
    const body = await req.text();

    // Verify Paystack signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    const signature = req.headers.get("x-paystack-signature");

    if (hash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse event data
    const event = JSON.parse(body);
    console.log("📌 Paystack webhook event:", event);

    if (event.event === "charge.success") {
      const { metadata, status, reference } = event.data;
      const { bookingId, userId, lodgeId } = metadata;

      if (bookingId && userId) {
        const bookingRef = doc(db, "users", userId, "bookings", bookingId);

        // Fetch the previous booking data
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
          console.error("❌ Booking not found:", bookingId);
          return new Response("Booking not found", { status: 404 });
        }
        const prevData = bookingSnap.data();

        // Fetch user info for notifications and email
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const userEmail = userData.email;
        const userName = userData.fullName || "User";

        // Update booking status in user's collection
        await updateDoc(bookingRef, {
          status: status === "success" ? "success" : "failed",
          updatedAt: new Date(),
          reference,
        });
        console.log("✅ Booking updated in user's Firestore:", bookingId);

        // Update/add to allBookings collection, keeping previous data
        const allBookingsRef = doc(db, "allBookings", bookingId);
        await updateDoc(allBookingsRef, {
          ...prevData,
          status: status === "success" ? "success" : "failed",
          reference,
          updatedAt: new Date(),
        }).catch(async () => {
          // If document doesn't exist, create it with previous + new fields
          await setDoc(allBookingsRef, {
            ...prevData,
            status: status === "success" ? "success" : "failed",
            reference,
            createdAt: prevData.createdAt || serverTimestamp(),
            updatedAt: new Date(),
          });
        });
        console.log("✅ Booking updated/created in allBookings:", bookingId);

        // Only send notifications & email if success
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
            read: false,
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
            read: false,
          });

          // Generate JWT token for internal API call
          if (userEmail) {
            const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
            try {
              const emailRes = await fetch(
                `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/emails/send-booking-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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
