import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { uid, fullName, phone, location, address, bio, imageUrl } = await req.json();

        if (!uid || !fullName || !phone || !location) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        await updateDoc(doc(db, 'users', uid), {
            fullName,
            phone,
            location,
            address: address || null,
            bio: bio || null,
            imageUrl: imageUrl || null,
            profileCompleted: true,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            message: 'Profile completed. Please log in again.',
            redirect: '/login'
        });

    } catch (error) {
        console.error('Profile completion error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
