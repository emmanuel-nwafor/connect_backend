import { db } from "@/lib/firebase";
import bcrypt from "bcryptjs";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(
                JSON.stringify({ success: false, error: "No token provided" }),
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid token" }),
                { status: 401 }
            );
        }

        const userId = decoded.userId;
        const { reason, password } = await req.json();

        if (!reason || !password) {
            return new Response(
                JSON.stringify({ success: false, error: "Reason and password required" }),
                { status: 400 }
            );
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save request to Firestore
        const payload = {
            userId,
            reason,
            password: hashedPassword,
            status: "pending",
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "deletionRequests"), payload);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Account deletion request submitted successfully.",
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Account deletion error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
