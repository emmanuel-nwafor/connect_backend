import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing userId" }),
                { status: 400 }
            );
        }

        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
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
        } else {
            return new Response(
                JSON.stringify({ success: true, fullName: null, email: null, imageUrl: null }),
                { status: 200 }
            );
        }
    } catch (err) {
        console.error("Failed to fetch user profile:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, imageUrl } = body;

        if (!userId || !imageUrl) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing userId or imageUrl" }),
                { status: 400 }
            );
        }

        await setDoc(doc(db, "users", userId), { imageUrl }, { merge: true });

        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
        console.error("Failed to save profile image:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
