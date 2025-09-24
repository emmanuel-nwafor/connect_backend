import { db } from "@/lib/firebase";
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const userId = decoded.userId;
        const body = await req.json();
        const { chatId, message } = body;

        if (!chatId || !message)
            return new Response(JSON.stringify({ success: false, error: "Missing chatId or message" }), { status: 400 });

        const chatDocRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatDocRef);
        if (!chatSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Chat not found" }), { status: 404 });
        }

        const messagesCollectionRef = collection(db, "chats", chatId, "messages");
        const messageDocRef = doc(messagesCollectionRef);
        await setDoc(messageDocRef, {
            senderId: userId,
            message,
            createdAt: serverTimestamp(),
            type: "text",
        });

        await updateDoc(chatDocRef, { updatedAt: serverTimestamp() });

        return new Response(JSON.stringify({ success: true, chatId }), { status: 200 });

    } catch (err) {
        console.error("❌ send error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
