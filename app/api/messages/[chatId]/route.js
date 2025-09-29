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
    updateDoc
} from "firebase/firestore";
import jwt from "jsonwebtoken";

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

        // Save message
        const messagesRef = collection(db, "chats", chatId, "messages");
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
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
