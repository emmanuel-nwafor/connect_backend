// app/api/admin/edit-lodge/route.js
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Lodge ID required" }), { status: 400 });
    }

    const lodgeRef = doc(db, "lodges", id);
    const lodgeSnap = await getDoc(lodgeRef);

    if (!lodgeSnap.exists()) {
      return new Response(JSON.stringify({ success: false, error: "Lodge not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, lodge: { id: lodgeSnap.id, ...lodgeSnap.data() } }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, title, rentFee, bedrooms, bathrooms, description } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Lodge ID is required" }), { status: 400 });
    }

    const lodgeRef = doc(db, "lodges", id);

    await updateDoc(lodgeRef, {
      ...(title && { title }),
      ...(rentFee && { rentFee }),
      ...(bedrooms && { bedrooms }),
      ...(bathrooms && { bathrooms }),
      ...(description && { description }),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true, message: "Lodge updated successfully" }), { status: 200 });
  } catch (err) {
    console.error("Error updating lodge:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
