import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const parseRent = (rent) => {
    if (!rent) return 0;
    if (typeof rent === "number") return rent;
    return parseFloat(rent.toString().replace(/,/g, "")) || 0;
};

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lodgeId = searchParams.get("lodgeId");
        if (!lodgeId)
            return new Response(
                JSON.stringify({ success: false, error: "lodgeId is required" }),
                { status: 400 }
            );

        // Fetch current lodge
        const lodgeRef = doc(db, "lodges", lodgeId);
        const lodgeSnap = await getDoc(lodgeRef);
        if (!lodgeSnap.exists())
            return new Response(
                JSON.stringify({ success: false, error: "Lodge not found" }),
                { status: 404 }
            );

        const currentLodge = lodgeSnap.data();
        const currentRent = parseRent(currentLodge.rentFee);

        // Fetch all lodges
        const lodgesRef = collection(db, "lodges");
        const lodgesSnap = await getDocs(lodgesRef);

        const similarLodges = [];
        lodgesSnap.forEach((docSnap) => {
            if (docSnap.id === lodgeId) return; // exclude current lodge
            const lodge = docSnap.data();
            const lodgeRent = parseRent(lodge.rentFee);

            const isSimilar =
                lodge.location?.trim().toLowerCase() === currentLodge.location?.trim().toLowerCase() &&
                lodge.propertyType?.trim().toLowerCase() === currentLodge.propertyType?.trim().toLowerCase() &&
                lodgeRent >= currentRent * 0.8 &&
                lodgeRent <= currentRent * 1.2;

            if (isSimilar) similarLodges.push({ id: docSnap.id, ...lodge });
        });

        return new Response(
            JSON.stringify({ success: true, lodges: similarLodges }),
            { status: 200 }
        );
    } catch (err) {
        console.error("Similar lodges error:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500 }
        );
    }
}
