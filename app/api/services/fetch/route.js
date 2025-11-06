// /api/services/fetch/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    console.log("Incoming request to /api/services/fetch");

    // Verify token
    const authHeader = req.headers.get("authorization");
    let decoded = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verified for user:", decoded);
      } catch (err) {
        console.warn("Invalid token:", err.message);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid or expired token",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log("No Authorization header found.");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Authorization token missing",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all service providers
    console.log("Fetching all service providers...");

    const q = query(
      collection(db, "serviceProviders"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const providers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${providers.length} service providers.`);

    return new Response(
      JSON.stringify({
        success: true,
        data: providers,
        userId: decoded.userId || null,
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
