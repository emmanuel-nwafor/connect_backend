import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
      imageUrls,
      kitchen,
      balcony,
      selfContained,
      category
    } = body;

    // Validation
    if (
      !title ||
      !description ||
      !rentFee ||
      !location ||
      !propertyType ||
      !category ||
      !imageUrls ||
      imageUrls.length === 0
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Add property to "lodges" collection
    const docRef = await addDoc(collection(db, 'lodges'), {
      title,
      description,
      rentFee,
      location,
      propertyType,
      category: category.toLowerCase(),
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      imageUrls,
      kitchen: kitchen || false,
      balcony: balcony || false,
      selfContained: selfContained || false,
      createdAt: serverTimestamp(),
    });

    // Notification to users about new lodge
    await addDoc(collection(db, "notifications"), {
      title: "New Property Available",
      message: `${title} has been added to the platform.`,
      role: "user",
      type: "alert",
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      title: "Property Uploaded Successfully",
      message: `${title} has been uploaded to listings.`,
      role: "admin",
      type: "alert",
      createdAt: serverTimestamp(),
    });

    return new Response(
      JSON.stringify({ success: true, id: docRef.id }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Save lodge error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
