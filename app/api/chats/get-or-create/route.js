// /api/chats/get-or-create/route.js
import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

// ✅ Create or Get Chat
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

        const { otherUserId } = await req.json();
        const userId = decoded.userId;

        if (!otherUserId) {
            return new Response(JSON.stringify({ success: false, error: "Missing otherUserId" }), { status: 400 });
        }

        // Check if chat already exists
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", userId));
        const snapshot = await getDocs(q);

        let chatId = null;
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.participants.includes(otherUserId)) {
                chatId = doc.id;
            }
        });

        if (!chatId) {
            // Create new chat
            const newChat = await addDoc(chatsRef, {
                participants: [userId, otherUserId],
                lastMessage: "",
                lastUpdated: serverTimestamp(),
            });
            chatId = newChat.id;
        }

        return new Response(JSON.stringify({ success: true, chatId }), { status: 200 });
    } catch (err) {
        console.error("Chat create error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

// ✅ Fetch Chats with Last Message
export async function GET(req) {
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

        const userId = decoded.userId;

        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", userId), orderBy("lastUpdated", "desc"));
        const snapshot = await getDocs(q);

        const chats = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                chatId: doc.id,
                participants: data.participants,
                lastMessage: data.lastMessage || "",
                lastUpdated: data.lastUpdated?.toDate() || null,
            };
        });

        return new Response(JSON.stringify({ success: true, chats }), { status: 200 });
    } catch (err) {
        console.error("Chat fetch error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
