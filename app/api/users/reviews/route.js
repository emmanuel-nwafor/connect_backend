import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export async function POST(req) {
    try {
        // Parse JSON safely
        const body = await req.json();
        const { lodgeId, rating, comment } = body;

        // Validate required fields
        if (!lodgeId || !rating || !comment) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Save review to Firebase
        const reviewDoc = {
            lodgeId,
            rating,
            comment,
            createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, "reviews"), reviewDoc);

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Review submission error:", err);

        return new Response(
            JSON.stringify({ success: false, error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
