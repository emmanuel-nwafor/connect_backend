import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function GET(req, { params }) {
  try {
    const { chatId } = params;

    if (!chatId || chatId === "undefined" || chatId === "null") {
      return new Response(JSON.stringify({ success: false, error: "Invalid chatId" }), { status: 400 });
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || null,
    }));

    return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
  } catch (err) {
    console.error("Fetch messages error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { chatId } = params;

    if (!chatId || chatId === "undefined" || chatId === "null") {
      return new Response(JSON.stringify({ success: false, error: "Invalid chatId" }), { status: 400 });
    }

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

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ success: false, error: "Message text required" }), { status: 400 });
    }

    const senderId = decoded.userId;

    // Check if this is the first message in the chat
    const messagesRef = collection(db, "chats", chatId, "messages");
    const existingMessages = await getDocs(messagesRef);
    const isFirstMessage = existingMessages.empty;

    // Save new message
    const messageRef = await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      status: "delivered",
    });

    // Update chat metadata
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
    });

    // === EMAIL + NOTIFICATION LOGIC (first message only) ===
    if (isFirstMessage) {
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const participants = chatData?.participants || [];

        // Identify the admin (receiver)
        const adminId = participants.find((id) => id !== senderId);

        if (adminId) {
          const adminRef = doc(db, "users", adminId);
          const adminSnap = await getDoc(adminRef);
          const userRef = doc(db, "users", senderId);
          const userSnap = await getDoc(userRef);

          const adminData = adminSnap.exists() ? adminSnap.data() : null;
          const userData = userSnap.exists() ? userSnap.data() : null;

          // === Send Email to Admin ===
          if (adminData?.role === "admin" && adminData?.email) {
            try {
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });

              const emailTemplate = `
                <html>
                  <body style="font-family: Poppins, sans-serif; background:#f4f4f4; padding:20px;">
                    <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:20px;">
                      <h2 style="color:#333;">New Chat Message</h2>
                      <p>You’ve received a new message from <b>${userData?.email || "a user"}</b>:</p>
                      <blockquote style="background:#f9f9f9; padding:10px; border-left:4px solid #007bff;">
                        ${text}
                      </blockquote>
                      <p><a href="${process.env.APP_URL}/admin/chat/${chatId}" style="color:#007bff;">View Chat</a></p>
                      <p style="font-size:12px; color:#777;">This is an automated message from your app.</p>
                    </div>
                  </body>
                </html>
              `;

              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: adminData.email,
                subject: "New Chat Message",
                html: emailTemplate,
              });

              console.log("✅ Email sent successfully to admin:", adminData.email);
            } catch (emailErr) {
              console.error("❌ Email sending error:", emailErr);
            }
          }

          // === Save Notifications ===
          const notificationsRef = collection(db, "notifications");

          // For Admin
          await addDoc(notificationsRef, {
            title: "New Chat Message",
            message: `You received a new message: "${text}"`,
            role: "admin",
            userId: adminId,
            type: "chat",
            createdAt: serverTimestamp(),
            read: false,
          });

          // For User
          await addDoc(notificationsRef, {
            title: "Message Sent",
            message: `Your message to ${adminData?.email || "the admin"} has been sent successfully.`,
            role: userData?.role || "user",
            userId: senderId,
            type: "chat",
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: messageRef.id,
          senderId,
          text,
          createdAt: new Date().toISOString(),
          status: "delivered",
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Send message error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
