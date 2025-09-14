import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
    try {
        const { uid } = await req.json();
        const userRef = doc(db, 'users', uid);

        await updateDoc(userRef, { isFirstTime: false });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
}
