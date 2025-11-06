// /api/services/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
  try {
    console.log("Fetching all service providers...");

    const q = query(collection(db, "serviceProviders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const providers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${providers.length} service providers.`);

    return new Response(
      JSON.stringify({ success: true, data: providers }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error fetching providers:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch service providers",
        error: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
