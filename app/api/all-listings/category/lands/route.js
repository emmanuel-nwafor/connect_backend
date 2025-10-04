// /app/api/all-listings/category/lands/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
    try {
        // Query Firestore for documents where category == "land"
        const q = query(
            collection(db, "lodges"),
            where("category", "==", "land")
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
        console.error("Error fetching apartment listings:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Failed to fetch apartment listings",
            }),
            { status: 500 }
        );
    }
}
