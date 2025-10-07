// /api/profile/upload-profile
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

// Fetch profile
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
                location: data.location || null,
                phone: data.phone || null,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("GET profile failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

// Update profile
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

        const userId = decoded.userId;
        const userRef = doc(db, "users", userId);
        const reqBody = await req.json();

        // Remove email from update if present
        const { email, ...allowedUpdates } = reqBody;

        // Only update fields if provided
        const updateData = {};
        for (const key in allowedUpdates) {
            if (allowedUpdates[key] !== undefined && allowedUpdates[key] !== null) {
                updateData[key] = allowedUpdates[key];
            }
        }

        await updateDoc(userRef, updateData);

        // Fetch updated document
        const updatedDoc = await getDoc(userRef);
        const data = updatedDoc.data();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Profile updated successfully",
                user: {
                    fullName: data.fullName || null,
                    email: data.email || null,
                    imageUrl: data.imageUrl || null,
                    location: data.location || null,
                    phone: data.phone || null,
                },
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("POST profile update failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
