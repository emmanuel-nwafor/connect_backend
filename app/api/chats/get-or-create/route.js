import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
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

        const userId = decoded.userId;
        const body = await req.json();
        const { adminId } = body;

        if (!adminId) {
            return new Response(JSON.stringify({ success: false, error: "Missing adminId" }), { status: 400 });
        }

        // 🔎 1) Check if chat already exists (participants contain both)
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", userId));
        const snapshot = await getDocs(q);

        let chatId = null;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.participants.includes(adminId)) {
                chatId = docSnap.id;
            }
        });

        // 🆕 2) If no chat exists, create one
        if (!chatId) {
            const newChatRef = doc(collection(db, "chats"));
            await setDoc(newChatRef, {
                participants: [userId, adminId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            chatId = newChatRef.id;
        }

        return new Response(JSON.stringify({ success: true, chatId }), { status: 200 });
    } catch (err) {
        console.error("❌ get-or-create chat error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
