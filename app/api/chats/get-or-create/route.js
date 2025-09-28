import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
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

        const { otherUserId } = await req.json(); // userId or adminId of the other participant
        const currentUserId = decoded.userId;

        if (!otherUserId) {
            return new Response(JSON.stringify({ success: false, error: "Missing otherUserId" }), { status: 400 });
        }

        const chatsRef = collection(db, "chats");

        // Query all chats that include the current user
        const q = query(chatsRef, where("participants", "array-contains", currentUserId));
        const snapshot = await getDocs(q);

        // Look for a chat that also contains the other user
        let chatId = null;
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.participants.includes(otherUserId)) {
                chatId = doc.id;
            }
        });

        // If no chat exists, create one
        if (!chatId) {
            const newChat = await addDoc(chatsRef, {
                participants: [currentUserId, otherUserId],
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
