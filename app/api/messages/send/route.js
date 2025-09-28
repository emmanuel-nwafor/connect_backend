import { db } from "@/lib/firebase"; // your firebase config
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { token, message, receiverId } = await req.json();

        if (!token || !message || !receiverId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const senderId = decoded.userId; // extracted from token payload

        // Save message to Firestore
        await addDoc(collection(db, "messages"), {
            text: message,
            senderId,
            receiverId,
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
