import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import jwt from "jsonwebtoken";

async function authenticateAdmin(req) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return { error: "No token provided", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { error: "Invalid token", status: 401 };
    }

    if (!decoded.role || decoded.role !== "admin") {
        return { error: "Unauthorized", status: 403 };
    }

    return { decoded };
}

// GET - Fetch deletion requests
export async function GET(req) {
    try {
        const auth = await authenticateAdmin(req);
        if (auth.error) return new Response(JSON.stringify({ success: false, error: auth.error }), { status: auth.status });

        const q = query(collection(db, "deletionRequests"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        return new Response(JSON.stringify({ success: true, requests }), { status: 200 });
    } catch (err) {
        console.error("❌ Fetch deletion requests error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message || "Server error" }), { status: 500 });
    }
}

// DELETE - Clear all deletion requests
export async function DELETE(req) {
    try {
        const auth = await authenticateAdmin(req);
        if (auth.error) return new Response(JSON.stringify({ success: false, error: auth.error }), { status: auth.status });

        const snapshot = await getDocs(collection(db, "deletionRequests"));
        const deletePromises = snapshot.docs.map((docRef) => deleteDoc(doc(db, "deletionRequests", docRef.id)));
        await Promise.all(deletePromises);

        return new Response(JSON.stringify({ success: true, message: "All deletion requests cleared" }), { status: 200 });
    } catch (err) {
        console.error("❌ Clear deletion requests error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message || "Server error" }), { status: 500 });
    }
}
