import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

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

        const { fullName, email, imageUrl } = await req.json();
        if (!fullName && !email && !imageUrl) {
            return new Response(JSON.stringify({ success: false, error: "Nothing to update" }), { status: 400 });
        }

        const userId = decoded.userId;
        const userRef = doc(db, "users", userId);

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (imageUrl) updateData.imageUrl = imageUrl;

        await updateDoc(userRef, updateData);

        return new Response(JSON.stringify({ success: true, message: "Profile updated", updatedFields: updateData }), {
            status: 200,
        });
    } catch (err) {
        console.error("POST update profile failed:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
