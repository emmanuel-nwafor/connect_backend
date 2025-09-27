// /app/api/messages/send/route.js
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const body = await req.json();
        const { chatId, text } = body;

        if (!chatId || !text) {
            return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400 });
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const senderId = decoded.userId;

        // Add message
        const messagesRef = collection(db, "chats", chatId, "messages");
        await addDoc(messagesRef, {
            senderId,
            text,
            createdAt: serverTimestamp(),
            read: false,
        });

        // Update chat meta
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastUpdated: serverTimestamp(),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Send message error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
