import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        console.log("Request method:", req.method);
        console.log("Request body:", req.body);
        const body = await req.json(); // <-- parse the ReadableStream into JSON
        console.log("Request body:", body);

        const { lodgeId } = body;

        if (!lodgeId) {
            return new Response(JSON.stringify({ error: "lodgeId is required" }), { status: 400 });
        }

        const favRef = doc(db, 'users', userId, 'favorites', lodgeId);
        const favDoc = await getDoc(favRef);

        if (favDoc.exists()) {
            // Remove favorite
            await deleteDoc(favRef);
            return NextResponse.json({ success: true, isFavorite: false });
        } else {
            // Add favorite
            await setDoc(favRef, { lodgeId, createdAt: new Date().toISOString() });
            return NextResponse.json({ success: true, isFavorite: true });
        }

    } catch (err) {
        console.error("Error in /favorites:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

