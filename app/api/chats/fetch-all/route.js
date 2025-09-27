import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
        // Check Authorization Header
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(
                JSON.stringify({ success: false, error: "No token provided" }),
                { status: 401 }
            );
        }

        // Verify Token
        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid token" }),
                { status: 401 }
            );
        }

        const userId = decoded.userId;
        const role = decoded.role || "user"; // role should be in token payload

        if (role !== "admin") {
            return new Response(
                JSON.stringify({ success: false, error: "Not authorized" }),
                { status: 403 }
            );
        }

        // Fetch all chats, sorted by latest update
        const chatsRef = collection(db, "chats");
        const snapshot = await getDocs(query(chatsRef, orderBy("lastUpdated", "desc")));

        const chats = snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,
                userId: data.userId,
                imageUrl: data.imageUrl || null,
                userName: data.userName || "Unknown User",
                lastMessage: data.lastMessage || "",
                lastUpdated: data.lastUpdated?.toDate
                    ? data.lastUpdated.toDate().toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    })
                    : "",
            };
        });

        return new Response(JSON.stringify({ success: true, chats }), { status: 200 });
    } catch (err) {
        console.error("Fetch all chats error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
