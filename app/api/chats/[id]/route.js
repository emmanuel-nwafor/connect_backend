import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        const messagesRef = collection(db, "chats", id, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return new Response(JSON.stringify({ success: true, messages }), { status: 200 });

    } catch (err) {
        console.error("❌ fetch messages error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
