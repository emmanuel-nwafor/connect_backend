// /api/services/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    console.log("Incoming request to /api/services/fetch");

    // Check for optional JWT
    const authHeader = req.headers.get("authorization");
    let decoded = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verified for user:", decoded?.userId || "Unknown");
      } catch (err) {
        console.warn("Invalid token:", err.message);
      }
    } else {
      console.log("No Authorization header — continuing as guest.");
    }

    // Fetch all service providers
    const q = query(collection(db, "serviceProviders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
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
        user: decoded ? { id: decoded.userId, email: decoded.email } : null,
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
