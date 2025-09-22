// /api/users/fetch-favorites.js
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 403 });
        }

        const userId = decoded.userId;

        // Reference to the user's favorites subcollection
        const favRef = collection(db, "users", userId, "favorites");
        const q = query(favRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const favorites = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ success: true, favorites });
    } catch (err) {
        console.error("Error fetching favorites:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
