// app/api/messages/[chatId]/route.js
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
} from "firebase/firestore";
import jwt from "jsonwebtoken";

function unauthorized(msg = "No token provided") {
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 401 });
}

export async function GET(req, { params }) {
    try {
        const { chatId } = params || {};

        // defensive: reject invalid chatId
        if (!chatId || chatId === "undefined" || chatId === "null") {
            return new Response(JSON.stringify({ success: false, error: "Invalid chatId" }), { status: 400 });
        }

        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.toISOString?.() || null,
        }));

        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
    } catch (err) {
        console.error("Fetch messages error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { chatId } = params || {};

        // defensive: reject invalid chatId early
        if (!chatId || chatId === "undefined" || chatId === "null") {
            return new Response(JSON.stringify({ success: false, error: "Invalid chatId" }), { status: 400 });
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return unauthorized();

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return unauthorized("Invalid token");
        }

        const { text } = await req.json();
        const senderId = decoded.userId;

        if (!text || !text.trim()) {
            return new Response(JSON.stringify({ success: false, error: "Message text required" }), { status: 400 });
        }

        // Save message in subcollection (safe now because chatId validated)
        const messagesRef = collection(db, "chats", chatId, "messages");
        const newMsg = await addDoc(messagesRef, {
            senderId,
            text,
            createdAt: serverTimestamp(),
            // status: 'delivered' // you can manage status later
        });

        // Update chat metadata atomically (we use updateDoc; if chat does not exist you'll get an error — that's desirable)
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
