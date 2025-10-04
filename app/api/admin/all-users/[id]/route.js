import { db } from "@/lib/firebase"; // adjust path if different
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// Authenticate JWT
async function authenticate(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return { error: "Unauthorized: No token provided", status: 401 };
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return { error: "Unauthorized: Invalid token", status: 403 };
        }

        return { decoded };
    } catch (err) {
        console.error("JWT error:", err);
        return { error: "Unauthorized: Token error", status: 403 };
    }
}

// Fetching of a user
export async function GET(req, { params }) {
    try {
        const auth = await authenticate(req);
        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const { id } = params;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { success: false, message: "Invalid user ID" },
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

        return NextResponse.json(
            {
                success: true,
                data: {
                    fullName: userData.fullName || null,
                    imageUrl: userData.imageUrl || null,
                    role: userData.role || "user",
                    location: userData.location || null,
                    email: userData.email || null,
                    phone: userData.phone || null,
                    profileCompleted: userData.profileCompleted || false,
                    createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || null,
                    updatedAt: userData.updatedAt?.toDate?.()?.toISOString?.() || null,
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

// Deleting of users
export async function DELETE(req, { params }) {
    try {
        const auth = await authenticate(req);
        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        // Only admins should be able to delete
        if (auth.decoded.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        const { id } = params;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { success: false, message: "Invalid user ID" },
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

        await deleteDoc(userRef);

        return NextResponse.json(
            { success: true, message: "User deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
