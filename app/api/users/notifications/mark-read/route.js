//  /api/users/notifications/mark-read
import { db } from "@/lib/firebase";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        // Validate JWT
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const userId = decoded.userId;

        // Query user's notifications
        const notificationsRef = collection(db, "notifications");
        const notificationsQuery = query(notificationsRef, where("userId", "==", userId));
        const snapshot = await getDocs(notificationsQuery);

        // Update unread notifications
        const batch = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.read) {
                batch.push(updateDoc(docSnap.ref, { read: true }));
            }
        });

        await Promise.all(batch);

        return new Response(JSON.stringify({ success: true, message: "Notifications marked as read" }), { status: 200 });
    } catch (err) {
        console.error("❌ Mark notifications error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
