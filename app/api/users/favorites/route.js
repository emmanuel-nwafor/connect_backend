import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { lodgeId, userId } = await req.json();
        if (!lodgeId || !userId) {
            return NextResponse.json({ success: false, error: 'Missing lodgeId or userId' }, { status: 400 });
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
        console.error('Favorite toggle error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
