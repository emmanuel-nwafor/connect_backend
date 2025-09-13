// app/api/profile/upload-profile/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return new Response(JSON.stringify({ success: false, error: "Missing userId" }), { status: 400 });
        }

        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return new Response(JSON.stringify({ success: true, imageUrl: docSnap.data().imageUrl }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: true, imageUrl: null }), { status: 200 });
        }
    } catch (err) {
        console.error("Failed to fetch profile image:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, imageUrl } = body;

        if (!userId || !imageUrl) {
            return new Response(JSON.stringify({ success: false, error: "Missing userId or imageUrl" }), { status: 400 });
        }

        // Save or update profile image
        await setDoc(doc(db, "profiles", userId), { imageUrl }, { merge: true });

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        console.error("Failed to save profile image:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
