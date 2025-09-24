import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
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

        const userId = decoded.userId;
        const body = await req.json();
        const { chatId, message } = body;

        if (!chatId || !message) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing chatId or message" }),
                { status: 400 }
            );
        }

        // 🔎 Ensure chat exists
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
            return new Response(
                JSON.stringify({ success: false, error: "Chat not found" }),
                { status: 404 }
            );
        }

        // 📨 Add message
        const messagesRef = collection(chatRef, "messages");
        await addDoc(messagesRef, {
            senderId: userId,
            message,
            timestamp: serverTimestamp(),
        });

        // ⏱️ Update last activity on chat
        await setDoc(
            chatRef,
            { updatedAt: serverTimestamp() },
            { merge: true }
        );

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("❌ send message error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
