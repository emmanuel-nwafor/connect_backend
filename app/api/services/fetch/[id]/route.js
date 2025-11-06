// /api/services/fetch/[id]/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    console.log(`Incoming request to /api/services/fetch/${id}`);

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

    // Fetch single provider from Firestore
    console.log(`Fetching service provider with ID: ${id}`);

    const docRef = doc(db, "serviceProviders", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Service provider not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Provider fetched successfully.");

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: docSnap.id, ...docSnap.data() },
        userId: decoded.userId || null,
      }),
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
