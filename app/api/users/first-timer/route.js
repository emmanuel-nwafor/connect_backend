// app/api/first-timer/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function POST(req) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing email" }),
                { status: 400 }
            );
        }

        // 🔹 Query users collection for this email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return new Response(JSON.stringify({ success: true, exists: true }), {
                status: 200,
            });
        } else {
            return new Response(JSON.stringify({ success: true, exists: false }), {
                status: 200,
            });
        }
    } catch (err) {
        console.error("First-timer check error:", err);
        return new Response(
            JSON.stringify({ success: false, error: "Internal server error" }),
            { status: 500 }
        );
    }
}
