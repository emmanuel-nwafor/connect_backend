// /api/services/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    console.log("Incoming request to /api/services/fetch");

    // Fetch all service providers without ordering or auth
    const snapshot = await getDocs(collection(db, "serviceProviders"));

    if (snapshot.empty) {
      console.log("No service providers found.");
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: "No service providers available",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const providers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${providers.length} service providers.`);

    return new Response(
      JSON.stringify({
        success: true,
        data: providers,
      }),
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
