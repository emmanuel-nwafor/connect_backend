// app/api/admin/save-lodge/route.js
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req) {
  try {
    const body = await req.json(); // parse JSON body

    const { title, description, rentFee, imageUrl, videoUrl } = body;

    if (!title || !description || !rentFee || !imageUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400 });
    }

    // Save lodge to Firestore
    const docRef = await addDoc(collection(db, 'lodges'), {
      title,
      description,
      rentFee,
      imageUrl,
      videoUrl: videoUrl || null,
      createdAt: serverTimestamp(),
    });

    return new Response(JSON.stringify({ success: true, id: docRef.id }), { status: 201 });
  } catch (err) {
    console.error('Firestore save failed:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), { status: 500 });
  }
}
