// app/api/all-listings/[id]/route.js

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    // Safely access params (in JS, params can sometimes be undefined in edge cases)
    const id = params?.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing property ID" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "lodges", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const lodgeData = docSnap.data();

    return NextResponse.json({
      success: true,
      lodge: { id: docSnap.id, ...lodgeData },
    });
  } catch (error) {
    console.error("Error fetching lodge:", error);

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}