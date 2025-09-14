import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req) {
    try {
        const { uid, email, name, phone } = await req.json();
        if (!uid || !email || !name) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        await setDoc(doc(db, "users", uid), {
            email,
            name,
            phone,
            role: "user",
            createdAt: new Date().toISOString(),
        });

        return new Response(JSON.stringify({ success: true, message: "User setup complete" }), { status: 200 });
    } catch (error) {
        console.error("User setup error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
