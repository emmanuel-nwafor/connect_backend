import { db } from "@/lib/firebase";
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export async function POST(req) {
    try {
        const body = await req.json();
        const { lodgeId, userId } = body;

        if (!lodgeId || !userId) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userRef = doc(db, "favorites", userId); // each user has a doc
        const userSnap = await getDoc(userRef);

        let isFavorite = false;

        if (userSnap.exists()) {
            const lodges = userSnap.data().lodges || [];

            if (lodges.includes(lodgeId)) {
                // Remove from favorites
                await updateDoc(userRef, { lodges: arrayRemove(lodgeId) });
                isFavorite = false;
            } else {
                // Add to favorites
                await updateDoc(userRef, { lodges: arrayUnion(lodgeId) });
                isFavorite = true;
            }
        } else {
            // Create new doc for user
            await setDoc(userRef, { lodges: [lodgeId] });
            isFavorite = true;
        }

        return new Response(
            JSON.stringify({ success: true, isFavorite }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Favorites error:", err);
        return new Response(
            JSON.stringify({ success: false, error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
