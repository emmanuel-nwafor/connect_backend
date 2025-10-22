// /app/api/messages/[chatId]/route.js
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
      return new Response(
        JSON.stringify({ success: false, error: "Invalid chatId" }),
        { status: 400 }
      );
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || null,
    }));

    return new Response(JSON.stringify({ success: true, messages }), {
      status: 200,
    });
  } catch (err) {
    console.error("Fetch messages error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { chatId } = params;

    if (!chatId || chatId === "undefined" || chatId === "null") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid chatId" }),
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "No token provided" }),
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401 }
      );
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Message text required" }),
        { status: 400 }
      );
    }

    const senderId = decoded.userId;

    // Check if this is the first message in the chat
    const messagesRef = collection(db, "chats", chatId, "messages");
    const existingMessages = await getDocs(messagesRef);
    const isFirstMessage = existingMessages.empty;

    // Save new message
    const docRef = await addDoc(messagesRef, {
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

    // === EMAIL LOGIC (trigger only on first message) ===
    if (isFirstMessage) {
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const participants = chatData?.participants || [];

        // Identify admin (the user this sender is chatting with)
        const adminId = participants.find((id) => id !== senderId);

        if (adminId) {
          const adminRef = doc(db, "users", adminId);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const adminData = adminSnap.data();

            // Only send if this user is an admin with an email
            if (adminData?.role === "admin" && adminData?.email) {
              try {
                const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                  },
                });

                await transporter.sendMail({
                  from: `"Support Chat" <${process.env.EMAIL_USER}>`,
                  to: adminData.email,
                  subject: "New Chat Message",
                  html: `
                    <p>You have a new message from a user.</p>
                    <p><b>Message:</b> ${text}</p>
                    <p>Go to app to view message</p>
                  `,
                });

                console.log("Email sent successfully to admin:", adminData.email);
              } catch (emailErr) {
                console.error("Email sending error:", emailErr);
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: docRef.id,
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
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
