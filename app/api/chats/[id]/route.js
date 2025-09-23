// /api/chats/[chatId].js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
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

        const { chatId } = params; // chatId = `${userId}_${adminId}`
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
