// app/api/admin/save-lodge/route.js
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      rentFee,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      imageUrl,
      kitchen,
      balcony,
      selfContained
    } = body;

    // Validate required fields
    if (!title || !description || !rentFee || !location || !propertyType || !imageUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400 });
    }

    const docRef = await addDoc(collection(db, 'lodges'), {
      title,
      description,
      rentFee,
      location,
      propertyType,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      imageUrl,
      kitchen: kitchen || false,
      balcony: balcony || false,
      selfContained: selfContained || false,
      createdAt: serverTimestamp(),
    });

    return new Response(JSON.stringify({ success: true, id: docRef.id }), { status: 201 });
  } catch (err) {
    console.error('Firestore save failed:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), { status: 500 });
  }
}
