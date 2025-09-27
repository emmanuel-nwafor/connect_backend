// /app/api/messages/[chatId]/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
    try {
        const { chatId } = params;
        const authHeader = req.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const messagesRef = collection(db, "chats", chatId, "messages");
        const snapshot = await getDocs(query(messagesRef, orderBy("createdAt", "asc")));

        const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
    } catch (err) {
        console.error("Fetch messages error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
