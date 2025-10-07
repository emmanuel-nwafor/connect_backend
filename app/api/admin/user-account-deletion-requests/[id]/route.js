// /api/admin/user-account-deletion-request/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req, { params }) {
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

        // Check admin role
        if (!decoded.role || decoded.role !== "admin") {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
        }

        const { status } = await req.json();
        if (!["approved", "rejected"].includes(status)) {
            return new Response(JSON.stringify({ success: false, error: "Invalid status" }), { status: 400 });
        }

        const docRef = doc(db, "deletionRequests", params.id);
        await updateDoc(docRef, { status });

        return new Response(JSON.stringify({ success: true, message: "Status updated successfully" }), { status: 200 });
    } catch (err) {
        console.error("❌ Update deletion request status error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
