import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, role, profileImageUrl } = body;

        if (!name || !role || !profileImageUrl) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400 }
            );
        }

        const docRef = await addDoc(collection(db, 'profiles'), {
            name,
            role, // "admin" or "user"
            profileImageUrl,
            createdAt: serverTimestamp(),
        });

        return new Response(JSON.stringify({ success: true, id: docRef.id }), { status: 201 });
    } catch (err) {
        console.error('Firestore save failed:', err);
        return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), { status: 500 });
    }
}
