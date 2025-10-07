// /api/profile/upload-profile
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

// Getting of users infos
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
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            return new Response(JSON.stringify({ success: false, error: "User not found" }), { status: 404 });
        }

        const data = docSnap.data();

        return new Response(
            JSON.stringify({
                success: true,
                fullName: data.fullName || null,
                email: data.email || null,
                imageUrl: data.imageUrl || null,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("GET profile failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

// uploading of profile images both admin and users
export async function POST(req) {
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

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            return new Response(JSON.stringify({ success: false, error: "No imageUrl provided" }), { status: 400 });
        }

        const userId = decoded.userId;
        const userRef = doc(db, "users", userId);

        // Update only the imageUrl
        await updateDoc(userRef, { imageUrl });

        // Fetch updated user document
        const updatedDoc = await getDoc(userRef);
        const data = updatedDoc.data();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Profile image updated",
                fullName: data.fullName || null,
                email: data.email || null,
                imageUrl: data.imageUrl || null,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("POST profile image failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}