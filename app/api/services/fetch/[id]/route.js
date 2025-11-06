// /api/services/fetch/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    console.log(`Fetching service provider with ID: ${id}`);

    const docRef = doc(db, "serviceProviders", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new Response(
        JSON.stringify({ success: false, message: "Service provider not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { id: docSnap.id, ...docSnap.data() } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error fetching provider:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch service provider",
        error: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
