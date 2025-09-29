// /app/api/chats/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        if (!id || id === "undefined" || id === "null") {
            return new Response(JSON.stringify({ success: false, error: "Invalid chatId" }), { status: 400 });
        }

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

        const chatRef = doc(db, "chats", id);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Chat not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, ...chatSnap.data(), id }), { status: 200 });
    } catch (err) {
        console.error("Fetch chat error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
