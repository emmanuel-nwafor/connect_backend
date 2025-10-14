import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    // Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "No token provided" }),
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Fetch user role from Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const userRole = userData.role; 

    if (userRole !== "admin") {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Not an admin" }),
        { status: 403 }
      );
    }

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
      videoUrl,
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

    // Add property to "lodges" collection with status
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
      videoUrl: videoUrl || null,
      kitchen: kitchen || false,
      balcony: balcony || false,
      selfContained: selfContained || false,
      status: 'available', 
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