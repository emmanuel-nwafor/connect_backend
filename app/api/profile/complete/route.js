import { db } from "@/lib/firebase"; // Firestore init
import { doc, getDoc, setDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        // 1️⃣ Validate JWT
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No token provided" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decoded.userId;

        // 2️⃣ Parse body
        const body = await req.json();
        const { fullName, phone, location, imageUrl } = body;

        if (!fullName || !phone || !location) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 3️⃣ Ensure user exists
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4️⃣ Update profile
        await setDoc(
            userRef,
            {
                fullName,
                phone,
                location,
                imageUrl: imageUrl || null,
                profileCompleted: true,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        return NextResponse.json({ message: "Profile completed successfully" });
    } catch (err) {
        console.error("Profile completion error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
