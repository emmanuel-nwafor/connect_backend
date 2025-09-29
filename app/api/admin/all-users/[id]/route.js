import { db } from "@/lib/firebase"; // adjust path if different
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        // Validate ID
        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { success: false, message: "Invalid user ID" },
                { status: 400 }
            );
        }

        // Fetch user doc
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const userData = userSnap.data();

        // ✅ Return only required fields
        return NextResponse.json(
            {
                success: true,
                data: {
                    fullName: userData.fullName || null,
                    imageUrl: userData.imageUrl || null,
                    role: userData.role || "user",
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error fetching user:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
