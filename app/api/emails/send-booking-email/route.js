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

        if (decoded.userId !== userId) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized request" }), { status: 403 });
        }

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }
        const userData = userSnap.data();

        const bookingRef = doc(db, "users", userId, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Booking not found" }), { status: 404 });
        }
        const bookingData = bookingSnap.data();

        const items = bookingData.items || []; // expect array like [{ name, price }, ...]

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const emailTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0; }
            .container { max-width: 700px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee; }
            .header img { max-width: 160px; }
            h2 { color: #333; }
            .details { margin: 20px 0; }
            .details p { margin: 6px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th, table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            table th { background: #f9fafb; }
            .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://res.cloudinary.com/dbczfoqnc/image/upload/v1757032861/Home-studio_logo-removebg-preview_gbq77s.png" alt="Company Logo">
              <h2>Booking Receipt</h2>
            </div>

            <p>Hello <b>${userData.fullName || "User"}</b>,</p>
            <p>Thank you for your booking. Here are your booking details:</p>

            <div class="details">
              <p><b>Booking ID:</b> ${bookingId}</p>
              <p><b>Lodge ID:</b> ${bookingData.lodgeId}</p>
              <p><b>Status:</b> ${bookingData.status}</p>
              <p><b>Date:</b> ${bookingData.createdAt?.toDate?.()?.toLocaleString() || "N/A"}</p>
            </div>

            ${items.length > 0 ? `
            <h3>Booked Items/Property</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price (₦)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${Number(item.price).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ` : ""}

            <p class="total">Total Paid: ₦${Number(bookingData.amount / 100).toLocaleString()}</p>

            <div class="footer">
              <p>&copy; 2025 CONNECT. All rights reserved.</p>
              <p>If you have any questions, contact our support.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userData.email,
            subject: "Your Booking Receipt",
            html: emailTemplate,
        });

        return new Response(JSON.stringify({ success: true, message: "Booking email sent successfully" }), { status: 200 });
    } catch (err) {
        console.error("❌ Booking email error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
