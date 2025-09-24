// /api/chats/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
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
        const userRole = decoded.role; // either "user" or "admin"

        // 2️⃣ Query chats where user is a participant
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", userId), orderBy("updatedAt", "desc"));
        const chatSnapshots = await getDocs(q);

        const chats = [];

        for (const chatDoc of chatSnapshots.docs) {
            const chatData = chatDoc.data();

            // get the other participant (admin if user, or user if admin)
            const otherParticipantId = chatData.participants.find(p => p !== userId);

            // fetch other participant info
            const otherUserSnap = await getDoc(doc(db, "users", otherParticipantId));
            const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : {};

            // get latest message
            const messagesRef = collection(db, "chats", chatDoc.id, "messages");
            const messagesSnap = await getDocs(query(messagesRef, orderBy("createdAt", "desc")));
            const latestMessageDoc = messagesSnap.docs[0];
            const latestMessage = latestMessageDoc ? latestMessageDoc.data() : null;

            chats.push({
                chatId: chatDoc.id,
                participant: {
                    id: otherUserData.id || otherParticipantId,
                    fullName: otherUserData.fullName || "Unknown",
                    imageUrl: otherUserData.imageUrl || null,
                    role: otherUserData.role || "user",
                },
                latestMessage,
                updatedAt: chatData.updatedAt,
            });
        }

        return new Response(JSON.stringify({ success: true, chats }), { status: 200 });

    } catch (err) {
        console.error("❌ Fetch chats error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
