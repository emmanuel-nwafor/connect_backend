import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

        const chatId = `chat_${userId}_${adminId}`;
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                participants: [userId, adminId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        return new Response(JSON.stringify({ success: true, chatId }), { status: 200 });
    } catch (err) {
        console.error("❌ get-or-create chat error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
