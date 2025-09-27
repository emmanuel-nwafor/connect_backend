import { db } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

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

        const { chatId, text } = await req.json();
        const userId = decoded.userId;

        if (!chatId || !text?.trim()) {
            return new Response(JSON.stringify({ success: false, error: "chatId and text are required" }), { status: 400 });
        }

        // Add message inside subcollection
        const messagesRef = collection(db, "chats", chatId, "messages");
        const newMsg = await addDoc(messagesRef, {
            senderId: userId,
            text,
            createdAt: serverTimestamp(),
        });

        // Update chat metadata
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastUpdated: serverTimestamp(),
        });

        return new Response(JSON.stringify({ success: true, id: newMsg.id }), { status: 200 });
    } catch (err) {
        console.error("Send message error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
