import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const { chatId } = params;
        if (!chatId) {
            return new Response(JSON.stringify({ success: false, error: "Missing chatId" }), { status: 400 });
        }

        const msgsRef = collection(db, "chats", chatId, "messages");
        const snapshot = await getDocs(query(msgsRef, orderBy("createdAt", "asc")));

        const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.().toISOString() || null,
        }));

        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
    } catch (err) {
        console.error("Fetch messages error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
