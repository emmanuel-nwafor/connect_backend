import { db } from "@/lib/firebase"; // your Firestore init
import { doc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { uid, fullName, phone, location, imageUrl } = body;

        if (!uid || !fullName || !phone || !location) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const userRef = doc(db, "users", uid);

        await setDoc(
            userRef,
            {
                fullName,
                phone,
                location,
                imageUrl: imageUrl || null,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        return NextResponse.json({ message: "Profile completed successfully" });
    } catch (err) {
        console.error("Profile completion error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
