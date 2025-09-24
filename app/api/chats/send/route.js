import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 403 });
        }

        const { chatId, message } = await req.json();
        if (!chatId || !message) {
            return new Response(JSON.stringify({ success: false, error: "Missing fields" }), { status: 400 });
        }

        await addDoc(collection(db, "chats", chatId, "messages"), {
            senderId: decoded.userId,
            message,
            createdAt: serverTimestamp(),
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
