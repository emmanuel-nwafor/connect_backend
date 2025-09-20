// /api/users/favorites
import { db } from '@/lib/firebase';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        // ✅ Verify JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
        }

        const { lodgeId } = await req.json();
        if (!lodgeId) {
            return NextResponse.json({ error: "lodgeId is required" }, { status: 400 });
        }

        const userId = decoded.userId; // ✅ from JWT, not client body

        const favRef = doc(db, "users", userId, "favorites", lodgeId);
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
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
