import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// GET /api/users/similar-listings?lodgeId=LODGE_ID&propertyType=TYPE&location=LOCATION
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lodgeId = searchParams.get("lodgeId");
        const propertyType = searchParams.get("propertyType");
        const location = searchParams.get("location");

        if (!lodgeId) return new Response(JSON.stringify({ success: false, error: "lodgeId required" }), { status: 400 });

        const lodgesRef = collection(db, "lodges");
        const snapshot = await getDocs(lodgesRef);

        const similar = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id !== lodgeId && (data.propertyType === propertyType || data.location === location)) {
                similar.push({ id: doc.id, ...data });
            }
        });

        return new Response(JSON.stringify({ success: true, lodges: similar.slice(0, 10) }), { status: 200 }); // limit 10
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
