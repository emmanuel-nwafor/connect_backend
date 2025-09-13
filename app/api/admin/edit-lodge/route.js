import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

// GET lodge details
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ success: false, error: "Lodge ID required" }), { status: 400 });

    const lodgeRef = doc(db, "lodges", id);
    const lodgeSnap = await getDoc(lodgeRef);
    if (!lodgeSnap.exists()) return new Response(JSON.stringify({ success: false, error: "Lodge not found" }), { status: 404 });

    return new Response(JSON.stringify({ success: true, lodge: { id: lodgeSnap.id, ...lodgeSnap.data() } }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// UPDATE lodge
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, title, rentFee, bedrooms, bathrooms, description, images } = body;
    if (!id) return new Response(JSON.stringify({ success: false, error: "Lodge ID is required" }), { status: 400 });

    const lodgeRef = doc(db, "lodges", id);
    await updateDoc(lodgeRef, {
      ...(title && { title }),
      ...(rentFee && { rentFee }),
      ...(bedrooms && { bedrooms }),
      ...(bathrooms && { bathrooms }),
      ...(description && { description }),
      ...(images && { images }),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true, message: "Lodge updated successfully" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// DELETE lodge
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ success: false, error: "Lodge ID required" }), { status: 400 });

    const lodgeRef = doc(db, "lodges", id);
    await deleteDoc(lodgeRef);

    return new Response(JSON.stringify({ success: true, message: "Lodge deleted successfully" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// CREATE lodge
export async function POST(req) {
  try {
    const body = await req.json();
    const { title, rentFee, bedrooms, bathrooms, description, images } = body;

    const lodgesRef = collection(db, "lodges");
    const docRef = await addDoc(lodgesRef, {
      title,
      rentFee,
      bedrooms,
      bathrooms,
      description,
      images: images || [],
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true, message: "Lodge created successfully", id: docRef.id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
