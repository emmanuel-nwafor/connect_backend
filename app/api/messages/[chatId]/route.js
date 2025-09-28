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

// GET messages with isAdmin flag
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

        // Fetch all users in the chat
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();
        const participants = chatData?.participants || [];

        // Fetch user roles
        const usersRoles = {};
        await Promise.all(
            participants.map(async (userId) => {
                const userSnap = await getDoc(doc(db, "users", userId));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    usersRoles[userId] = data.role === "admin"; // true if admin
                } else {
                    usersRoles[userId] = false;
                }
            })
        );

        const messages = snapshot.docs.map((d) => {
            const data = d.data();
            return {
                id: d.id,
                senderId: data.senderId,
                text: data.text,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                status: data.status || "delivered",
                isAdmin: usersRoles[data.senderId] || false,
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

// POST message
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

        // Add message
        const messagesRef = collection(db, "chats", chatId, "messages");
        const docRef = await addDoc(messagesRef, {
            senderId,

            text,
            createdAt: serverTimestamp(),
            status: "delivered",
            isAdmin: usersRoles[data.senderId] || false,

        });

        // Update chat metadata
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            lastMessage: text,
            lastUpdated: serverTimestamp(),
            isAdmin: usersRoles[data.senderId] || false,

        });

        // Determine isAdmin for sender
        const userSnap = await getDoc(doc(db, "users", senderId));
        const isAdmin = userSnap.exists() && userSnap.data().role === "admin";

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
                    isAdmin,
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
