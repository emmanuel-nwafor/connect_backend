// /api/users/notifications/route.js
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
        // 1️⃣ Validate JWT
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(
                JSON.stringify({ success: false, error: "No token provided" }),
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid token" }),
                { status: 401 }
            );
        }

        const userId = decoded.userId;

        // 2️⃣ Fetch user role from Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(
                JSON.stringify({ success: false, error: "User not found" }),
                { status: 404 }
            );
        }

        const userData = userSnap.data();
        const userRole = userData.role; // "admin" or "user"

        if (!userRole) {
            return new Response(
                JSON.stringify({ success: false, error: "User role missing" }),
                { status: 400 }
            );
        }

        // 3️⃣ Fetch notifications where role == userRole
        const notiRef = collection(db, "notifications");
        const notiQuery = query(notiRef, where("role", "==", userRole));
        const notiSnap = await getDocs(notiQuery);

        const notifications = notiSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // 4️⃣ Return notifications
        return new Response(
            JSON.stringify({ success: true, notifications }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Notifications fetch error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
