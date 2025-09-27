import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

// GET: Fetch messages for a chat
export async function GET(req, { params }) {
    try {
        const { chatId } = params;

        if (!chatId) {
            return new Response(JSON.stringify({ success: false, error: "chatId is required" }), { status: 400 });
        }

        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || null,
        }));

        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
    } catch (err) {
        console.error("Fetch messages error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

// POST: Send a message in a chat
export async function POST(req, { params }) {
    try {
        const { chatId } = params;
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
        const userId = decoded.userId;

        if (!chatId || !text?.trim()) {
            return new Response(JSON.stringify({ success: false, error: "chatId and text are required" }), { status: 400 });
        }

        // Save message in subcollection
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
