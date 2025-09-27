// app/api/messages/send/route.js
import { db } from "@/lib/firebase"; // your firebase client sdk config
import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { chatId, senderId, text } = body;

        if (!chatId || !senderId || !text) {
            return NextResponse.json(
                { success: false, message: "chatId, senderId, and text are required" },
                { status: 400 }
            );
        }

        // Reference to the chat document
        const chatRef = doc(db, "chats", chatId);

        // Add message under messages subcollection of the chat
        const messageRef = await addDoc(collection(chatRef, "messages"), {
            senderId,
            text,
            createdAt: serverTimestamp(),
            status: "sent", // you can later update this to "delivered" or "read"
        });

        // Update lastMessage and lastUpdated in chat doc
        await updateDoc(chatRef, {
            lastMessage: text,
            lastUpdated: serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            messageId: messageRef.id,
        });
    } catch (error) {
        console.error("❌ Error sending message:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
