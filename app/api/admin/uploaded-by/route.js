import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// GET /api/admin/uploaded-by?lodgeId=LODGE_ID
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const lodgeId = searchParams.get("lodgeId");
        if (!lodgeId) return new Response(JSON.stringify({ success: false, error: "lodgeId required" }), { status: 400 });

        const lodgeRef = doc(db, "lodges", lodgeId);
        const lodgeSnap = await getDoc(lodgeRef);

        if (!lodgeSnap.exists()) return new Response(JSON.stringify({ success: false, error: "Lodge not found" }), { status: 404 });

        const lodgeData = lodgeSnap.data();
        const uploadedBy = lodgeData.uploadedBy || { name: "Admin", email: "admin@example.com" };

        return new Response(JSON.stringify({ success: true, uploadedBy }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
