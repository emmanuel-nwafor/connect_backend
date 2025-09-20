import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
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
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const data = docSnap.data();
        return new Response(
            JSON.stringify({
                success: true,
                imageUrl: data.imageUrl || null,
                fullName: data.fullName || null,
                email: data.email || null,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("Failed to fetch user profile:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
