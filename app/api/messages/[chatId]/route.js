// /api/chats/[chatId]/route.js
import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import jwt from "jsonwebtoken";

function unauthorized(msg = "No token provided") {
    return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 401,
    });
}

// ✅ GET messages with isAdmin, fullName & imageUrl
export async function GET(req, { params }) {
    try {
        const { chatId } = params || {};
        if (!chatId || chatId === "undefined" || chatId === "null") {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid chatId" }),
                { status: 400 }
            );
        }

        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        // Fetch participants info
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();
        const participants = chatData?.participants || [];

        // Cache roles + profiles
        const usersInfo = {};
        await Promise.all(
            participants.map(async (userId) => {
                const userSnap = await getDoc(doc(db, "users", userId));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    usersInfo[userId] = {
                        isAdmin: data.role === "admin",
                        fullName: data.fullName || "Unknown",
                        imageUrl: data.imageUrl || null,
                    };
                } else {
                    usersInfo[userId] = {
                        isAdmin: false,
                        fullName: "Unknown",
                        imageUrl: null,
                    };
                }
            })
        );

        const messages = snapshot.docs.map((d) => {
            const data = d.data();
            const sender = usersInfo[data.senderId] || {};
            return {
                id: d.id,
                senderId: data.senderId,
                text: data.text,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                status: data.status || "delivered",
                isAdmin: sender.isAdmin || false,
                fullName: sender.fullName,
                imageUrl: sender.imageUrl,
            };
        });

        return new Response(JSON.stringify({ success: true, messages }), {
            status: 200,
        });
    } catch (err) {
        console.error("Fetch messages error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}

// ✅ POST message with fullName & imageUrl stored
export async function POST(req, { params }) {
    try {
        const { chatId } = params || {};
        if (!chatId || chatId === "undefined" || chatId === "null") {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid chatId" }),
                { status: 400 }
            );
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return unauthorized();

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return unauthorized("Invalid token");
        }

        const { text } = await req.json();
        const senderId = decoded.userId;

        if (!text || !text.trim()) {
            return new Response(
                JSON.stringify({ success: false, error: "Message text required" }),
                { status: 400 }
            );
        }

        // Fetch sender info
        const userSnap = await getDoc(doc(db, "users", senderId));
        let senderData = {
            isAdmin: false,
            fullName: "Unknown",
            imageUrl: null,
        };
        if (userSnap.exists()) {
            const data = userSnap.data();
            senderData = {
                isAdmin: data.role === "admin",
                fullName: data.fullName || "Unknown",
                imageUrl: data.imageUrl || null,
            };
        }

        // Add message
        const messagesRef = collection(db, "chats", chatId, "messages");
        const docRef = await addDoc(messagesRef, {
            senderId,
            text,
            createdAt: serverTimestamp(),
            status: "delivered",
            fullName: senderData.fullName,
            imageUrl: senderData.imageUrl,
        });

        // Update chat metadata
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastUpdated: serverTimestamp(),
        });

        return new Response(
            JSON.stringify({
                success: true,
                id: docRef.id,
                message: {
                    id: docRef.id,
                    senderId,
                    text,
                    createdAt: new Date().toISOString(),
                    status: "delivered",
                    isAdmin: senderData.isAdmin,
                    fullName: senderData.fullName,
                    imageUrl: senderData.imageUrl,
                },
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("Send message error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
