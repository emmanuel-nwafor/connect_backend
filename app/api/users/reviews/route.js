import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// GET /api/users/reviews?lodgeId=LODGE_ID
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lodgeId = searchParams.get("lodgeId");
        if (!lodgeId) {
            return new Response(JSON.stringify({ success: false, error: "lodgeId required" }), { status: 400 });
        }

        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("lodgeId", "==", lodgeId));
        const snapshot = await getDocs(q);

        const reviews = [];
        let totalRating = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            reviews.push({ id: doc.id, ...data });
            totalRating += data.rating || 0;
        });

        const averageRating = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;

        return new Response(JSON.stringify({ success: true, reviews, averageRating }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
