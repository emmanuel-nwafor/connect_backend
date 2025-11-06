// /api/services/apply-provider/route.js
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    const body = await req.json();
    let userId = null;
    if (auth?.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    }

    const { name, email, phone, serviceType, description, isStudent } = body;
    if (!name || !email || !phone || !serviceType || !description)
      return new Response(
        JSON.stringify({ success: false, message: "Fill all fields" }),
        { status: 400 }
      );

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
      JSON.stringify({ success: true, id: ref.id }),
      { status: 201 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch one
    if (id) {
      const snap = await getDoc(doc(db, "serviceProviders", id));
      if (!snap.exists())
        return new Response(
          JSON.stringify({ success: false, message: "Not found" }),
          { status: 404 }
        );
      return new Response(
        JSON.stringify({ success: true, data: { id: snap.id, ...snap.data() } }),
        { status: 200 }
      );
    }

    // Fetch all
    const q = query(
      collection(db, "serviceProviders"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return new Response(JSON.stringify({ success: true, data: list }), {
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
    });
  }
}