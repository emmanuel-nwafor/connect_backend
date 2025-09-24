import { db } from "@/lib/firebase";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });

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

        if (!adminId)
            return new Response(JSON.stringify({ success: false, error: "Missing adminId" }), { status: 400 });

        // check if chat exists
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", userId));
        const snapshot = await getDocs(q);

        let existingChat = null;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.participants.includes(adminId)) {
                existingChat = { id: docSnap.id, ...data };
            }
        });

        if (existingChat) {
            return new Response(JSON.stringify({ success: true, chatId: existingChat.id }), { status: 200 });
        }

        // create new chat
        const chatRef = doc(chatsRef);
        await setDoc(chatRef, {
            participants: [userId, adminId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return new Response(JSON.stringify({ success: true, chatId: chatRef.id }), { status: 200 });

    } catch (err) {
        console.error("❌ get-or-create error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
