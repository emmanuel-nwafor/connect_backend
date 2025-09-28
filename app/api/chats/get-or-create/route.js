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

        const { adminId, otherUserId } = await req.json();
        const loggedInUserId = decoded.userId;

        const participantA = adminId || loggedInUserId;
        const participantB = otherUserId;

        if (!participantB) {
            return new Response(JSON.stringify({ success: false, error: "Missing otherUserId" }), { status: 400 });
        }

        // Check if chat already exists
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", participantA));
        const snapshot = await getDocs(q);

        let chatId = null;
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.participants.includes(participantB)) {
                chatId = doc.id;
            }
        });

        if (!chatId) {
            const newChat = await addDoc(chatsRef, {
                participants: [participantA, participantB],
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
