import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { token, message, receiverId } = await req.json();
        if (!token || !message || !receiverId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        let decoded;
        try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
        catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

        const senderId = decoded.userId;

        // Get sender and receiver info
        const senderSnap = await getDoc(doc(db, "users", senderId));
        const receiverSnap = await getDoc(doc(db, "users", receiverId));
        if (!senderSnap.exists() || !receiverSnap.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const senderData = senderSnap.data();
        const receiverData = receiverSnap.data();

        await addDoc(collection(db, "messages"), {
            text: message,
            senderId,
            receiverId,
            createdAt: serverTimestamp(),
        });

        // ✅ Notification
        await addDoc(collection(db, "notifications"), {
            title: "New Message",
            message: `${senderData.email} sent you a new message.`,
            role: receiverData.role, // admin/user
            createdAt: serverTimestamp(),
            type: "message",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Message send error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
