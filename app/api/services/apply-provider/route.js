// /api/services/apply-provider/route.js
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, getDoc, doc, serverTimestamp } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    console.log("Incoming request to /api/services/apply-provider");

    const auth = req.headers.get("authorization");
    const body = await req.json();

    let userId = null;
    if (auth?.startsWith("Bearer ")) {
      try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
        // Ignore invalid token (since users can still apply without login)
        userId = null;
      }
    }

    const { name, email, phone, serviceType, description, isStudent } = body;

    if (!name || !email || !phone || !serviceType || !description) {
      return new Response(
        JSON.stringify({ success: false, message: "Please fill all fields." }),
        { status: 400 }
      );
    }

    const ref = await addDoc(collection(db, "serviceProviders"), {
      name,
      email,
      phone,
      serviceType,
      description,
      isStudent: !!isStudent,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Application submitted", id: ref.id }),
      { status: 201 }
    );
  } catch (e) {
    console.error("Error in apply-provider POST:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch single provider by ID
    if (id) {
      const snap = await getDoc(doc(db, "serviceProviders", id));
      if (!snap.exists()) {
        return new Response(
          JSON.stringify({ success: false, message: "Service provider not found." }),
          { status: 404 }
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: { id: snap.id, ...snap.data() } }),
        { status: 200 }
      );
    }

    // Fetch all providers (no order)
    const snap = await getDocs(collection(db, "serviceProviders"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
    });
  } catch (e) {
    console.error("Error in apply-provider GET:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
    });
  }
}
