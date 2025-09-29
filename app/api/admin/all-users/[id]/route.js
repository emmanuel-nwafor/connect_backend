// /api/admin/all-users/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const userData = userSnap.data();

        // If the role is admin → return static "Admin" details
        if (userData.role === "admin") {
            return NextResponse.json(
                {
                    success: true,
                    user: {
                        fullName: "Admin",
                        imageUrl:
                            "https://i.pinimg.com/736x/de/99/f5/de99f59cb3bcd5a35439084666dbddc8.jpg", // default admin avatar
                        role: "admin",
                    },
                },
                { status: 200 }
            );
        }

        // Otherwise → return actual user details
        return NextResponse.json(
            {
                success: true,
                user: {
                    fullName: userData.fullName || "Unnamed User",
                    imageUrl:
                        userData.imageUrl ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png", // default user avatar
                    role: userData.role || "user",
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error fetching user:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
