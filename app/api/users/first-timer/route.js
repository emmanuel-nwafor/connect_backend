import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function POST(req) {
    try {
        const { email } = await req.json();
        if (!email) return new Response(JSON.stringify({ success: false, error: "Missing email" }), { status: 400 });

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        return new Response(
            JSON.stringify({ success: true, exists: !snapshot.empty }),
            { status: 200 }
        );
    } catch (err) {
        console.error("First-timer check error:", err);
        return new Response(JSON.stringify({ success: false, error: "Internal server error" }), { status: 500 });
    }
}
