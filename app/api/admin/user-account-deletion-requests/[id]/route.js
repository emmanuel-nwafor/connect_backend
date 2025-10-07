// /api/admin/user-account-deletion-request/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
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

        if (!decoded.isAdmin) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
        }

        const { id } = params;
        const docRef = doc(db, "deletionRequests", id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return new Response(JSON.stringify({ success: false, error: "Request not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, request: snapshot.data() }), { status: 200 });
    } catch (err) {
        console.error("❌ Fetch single deletion request error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
