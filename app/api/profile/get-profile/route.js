import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export async function GET() {
    try {
        const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const profiles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return new Response(JSON.stringify({ success: true, profiles }), { status: 200 });
    } catch (err) {
        console.error('Failed to fetch profiles:', err);
        return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), { status: 500 });
    }
}
