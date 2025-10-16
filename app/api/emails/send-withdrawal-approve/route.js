import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    console.log("📨 Incoming request to /api/emails/send-withdrawal-approve");

    const authHeader = req.headers.get("authorization");
    const body = await req.json();
    console.log("📩 Request body:", body);

    // --- VERIFY TOKEN ---
    let decoded = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token verified:", decoded);
      } catch (err) {
        console.warn("⚠️ Invalid token:", err.message);
        return new Response(
          JSON.stringify({ success: false, message: "Invalid token" }),
          { status: 401 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Missing authorization" }),
        { status: 401 }
      );
    }

    const { userId, email, amount } = body;
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ success: false, error: "userId or email is required" }),
        { status: 400 }
      );
    }

    // --- FETCH USER ---
    let userData = null;
    if (userId) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404 }
        );
      }
      userData = userSnap.data();
    } else {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (snap.empty) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404 }
        );
      }
      userData = snap.docs[0].data();
    }

    // --- MAIL TRANSPORTER ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailTemplate = `
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 650px; background: #fff; padding: 30px; margin: auto; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.05);">
          <h2 style="text-align:center; color:#10B981;">Withdrawal Approved 🎉</h2>
          <p>Hello <b>${userData.name || userData.email || "User"}</b>,</p>
          <p>Great news! Your recent withdrawal request of <b>₦${amount?.toLocaleString() || "N/A"}</b> has been <b>approved</b> and processed successfully.</p>
          <p>You should receive the funds in your bank account shortly.</p>
          <p>If you do not see the payment within 24 hours, please contact our support team.</p>
          <p style="margin-top:20px;">Thank you for trusting <b>Connect</b>!</p>
          <div style="text-align:center;margin-top:30px;">
            <a href="https://connect.vercel.app/" style="background:#10B981;color:#fff;padding:12px 25px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Dashboard</a>
          </div>
          <p style="font-size:12px;color:#777;text-align:center;margin-top:30px;">© 2025 CONNECT. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Connect" <no-reply@connect.com>`,
      to: userData.email,
      subject: "Withdrawal Approved – Connect",
      html: emailTemplate,
    });

    console.log("✅ Approval email sent to:", userData.email);
    return new Response(
      JSON.stringify({ success: true, message: "Approval email sent successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Withdrawal approval email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
