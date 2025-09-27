// /app/api/chats/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
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

        const userId = decoded.userId;
        const userRole = decoded.role; // "user" or "admin"

        // Fetch chats where userId is in participants
        const chatsRef = collection(db, "chats");
        const q = query(
            chatsRef,
            where("participants", "array-contains", userId),
            orderBy("lastUpdated", "desc")
        );

        const snapshot = await getDocs(q);

        const chats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return new Response(JSON.stringify({ success: true, chats }), { status: 200 });
    } catch (err) {
        console.error("Fetch chats error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
