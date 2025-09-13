import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, imageUrl, role } = body; // role: 'admin' or 'user'

        if (!userId || !imageUrl) {
            return new Response(JSON.stringify({ success: false, error: "Missing userId or imageUrl" }), { status: 400 });
        }

        const docRef = doc(db, "profiles", userId);
        await setDoc(docRef, {
            imageUrl,
            role: role || "user",
            updatedAt: serverTimestamp(),
        }, { merge: true });

        return new Response(JSON.stringify({ success: true, imageUrl }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (!userId) throw new Error("Missing userId");

        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return new Response(JSON.stringify({ success: false, imageUrl: null }), { status: 404 });

        return new Response(JSON.stringify({ success: true, imageUrl: docSnap.data().imageUrl }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
