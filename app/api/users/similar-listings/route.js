import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lodgeId = searchParams.get("lodgeId");
        if (!lodgeId)
            return new Response(JSON.stringify({ success: false, error: "lodgeId is required" }), { status: 400 });

        // Fetch current lodge
        const lodgeRef = doc(db, "lodges", lodgeId);
        const lodgeSnap = await getDoc(lodgeRef);
        if (!lodgeSnap.exists())
            return new Response(JSON.stringify({ success: false, error: "Lodge not found" }), { status: 404 });

        const currentLodge = lodgeSnap.data();
        const currentRent = parseFloat(currentLodge.rentFee.replace(/,/g, "")) || 0;

        // Fetch all lodges
        const lodgesRef = collection(db, "lodges");
        const lodgesSnap = await getDocs(lodgesRef);

        // Filter similar lodges
        const similarLodges = [];
        lodgesSnap.forEach((docSnap) => {
            if (docSnap.id === lodgeId) return; // exclude current lodge
            const lodge = docSnap.data();

            // Optional: parse rentFee as number
            const lodgeRent = parseFloat((lodge.rentFee || "0").replace(/,/g, "")) || 0;

            // Filter conditions: same location and propertyType, and rent within ±20%
            const isSimilar =
                lodge.location === currentLodge.location &&
                lodge.propertyType === currentLodge.propertyType &&
                lodgeRent >= currentRent * 0.8 &&
                lodgeRent <= currentRent * 1.2;

            if (isSimilar) similarLodges.push({ id: docSnap.id, ...lodge });
        });

        return new Response(
            JSON.stringify({ success: true, lodges: similarLodges }),
            { status: 200 }
        );
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
