// /api/services/apply-provider
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    console.log("📨 Incoming request to /api/services/apply-provider");

    const authHeader = req.headers.get("authorization");
    const body = await req.json();
    console.log("📩 Request body:", body);

    let decoded = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token verified:", decoded);
      } catch (err) {
        console.warn("⚠️ Token invalid:", err.message);
      }
    } else {
      console.log("ℹNo Authorization header found. Continuing without token...");
    }

    const { name, email, phone, serviceType, description, isStudent } = body;

    if (!name || !email || !phone || !serviceType || !description) {
      console.warn("❌ Missing required fields");
      return new Response(JSON.stringify({ success: false, error: "All fields are required" }), { status: 400 });
    }

    // Save to Firestore
    const docRef = await addDoc(collection(db, "serviceProviders"), {
      name,
      email,
      phone,
      serviceType,
      description,
      isStudent: !!isStudent,
      userId: decoded?.userId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("User info saved with ID:", docRef.id);

    return new Response(JSON.stringify({ success: true, message: "Info submitted successfully", id: docRef.id }), {
      status: 200,
    });
  } catch (err) {
    console.error("Submission error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
