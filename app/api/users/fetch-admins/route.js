// /api/users/fetch-admins/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 403 });
        }

        const snapshot = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
        const admins = snapshot.docs.map(doc => ({
            id: doc.id,
            fullName: doc.data().fullName,
            imageUrl: doc.data().imageUrl,
            email: doc.data().email,
            phone: doc.data().phone
        }));

        return new Response(JSON.stringify({ success: true, admins }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
