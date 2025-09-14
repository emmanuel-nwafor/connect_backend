import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId, fullName, phone, location, address, bio, imageUrl, isFirstTime } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
            fullName,
            phone,
            location,
            address,
            bio,
            imageUrl: imageUrl || null,
            isFirstTime: false, // mark setup complete
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Profile setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
