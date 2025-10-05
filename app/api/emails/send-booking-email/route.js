// /api/emails/send-booking-email/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const { bookingId, userId } = await req.json();
        if (!bookingId || !userId) {
            return new Response(JSON.stringify({ success: false, error: "bookingId and userId are required" }), { status: 400 });
        }

        // Fetch user
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }
        const userData = userSnap.data();

        // Fetch booking
        const bookingRef = doc(db, "users", userId, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Booking not found" }), { status: 404 });
        }
        const bookingData = bookingSnap.data();

        // Receipt email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userData.email,
            subject: "Booking Receipt",
            html: `
        <h2>Hello ${userData.fullName || "User"},</h2>
        <p>Thank you for your booking. Here are your booking details:</p>
        <ul>
          <li>Booking ID: ${bookingId}</li>
          <li>Lodge ID: ${bookingData.lodgeId}</li>
          <li>Amount: ₦${bookingData.amount}</li>
          <li>Status: ${bookingData.status}</li>
          <li>Date: ${bookingData.createdAt?.toDate?.()?.toLocaleString() || "N/A"}</li>
        </ul>
        <p>We appreciate your business!</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ success: true, message: "Booking email sent successfully" }), { status: 200 });
    } catch (err) {
        console.error("❌ Booking email error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
