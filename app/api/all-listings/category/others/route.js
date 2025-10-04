// /app/api/all-listings/category/others/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
    try {
        const excludedCategories = ["house", "apartment", "land", "shop"];
        const q = query(
            collection(db, "lodges"),
            where("category", "not-in", excludedCategories)
        );

        const querySnapshot = await getDocs(q);

        const listings = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return new Response(JSON.stringify({ success: true, listings }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching other listings:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to fetch other listings",
            }),
            { status: 500 }
        );
    }
}
