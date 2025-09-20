import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");
        console.log("Authorization header:", authHeader);

        if (!authHeader?.startsWith("Bearer ")) {
            console.error("No Bearer token in header");
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        console.log("Token extracted:", token);

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("JWT decoded:", decoded);
        } catch (jwtErr) {
            console.error("JWT verification failed:", jwtErr.message);
            return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401 });
        }

        const userId = decoded.userId;
        console.log("Fetching user with ID:", userId);

        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.error("Firestore document does not exist for user:", userId);
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const data = docSnap.data();
        console.log("User data fetched:", data);

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
        console.error("GET profile failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
