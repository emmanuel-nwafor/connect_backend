// /api/users/favorites
import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        console.log("Request method:", req.method);
        console.log("Request body:", req.body);
        const body = await req.json();
        const { lodgeId, userId } = body;

        if (!lodgeId || !userId) {
            return new Response(JSON.stringify({ error: "lodgeId and userId are required" }), { status: 400 });
        }

        const favRef = doc(db, 'users', userId, 'favorites', lodgeId);
        const favDoc = await getDoc(favRef);

        if (favDoc.exists()) {
            await deleteDoc(favRef);
            return NextResponse.json({ success: true, isFavorite: false });
        } else {
            await setDoc(favRef, { lodgeId, createdAt: new Date().toISOString() });
            return NextResponse.json({ success: true, isFavorite: true });
        }
    } catch (err) {
        console.error("Error in /favorites:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
