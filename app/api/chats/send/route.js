// /api/chats/send.js
import { db } from "@/lib/firebase";
import { randomBytes } from "crypto";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
        const body = await req.json();
        const { adminId, message } = body;

        if (!adminId || !message) {
            return new Response(JSON.stringify({ success: false, error: "Missing adminId or message" }), { status: 400 });
        }

        // 2️⃣ Generate a unique chat ID if chat doesn't exist
        const chatDocRef = doc(db, "chats", `chat_${userId}_${adminId}`);
        const chatSnap = await getDoc(chatDocRef);

        let chatId;
        if (chatSnap.exists()) {
            chatId = chatSnap.id; // reuse existing chat ID
        } else {
            chatId = `chat_${randomBytes(8).toString("hex")}`; // new unique chat ID
            // create chat document
            await setDoc(chatDocRef, {
                chatId,
                participants: [userId, adminId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: [] // initialize empty messages array
            });
        }

        // 3️⃣ Add message to chat
        const messageDocRef = doc(db, "chats", chatId, "messages", randomBytes(8).toString("hex"));
        await setDoc(messageDocRef, {
            senderId: userId,
            message,
            createdAt: serverTimestamp(),
            type: "text"
        });

        return new Response(JSON.stringify({ success: true, chatId }), { status: 200 });

    } catch (err) {
        console.error("❌ Chat send error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
