import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing property ID" },
        { status: 400 },
        console.log(error)
      );
    }

    const docRef = doc(db, "lodges", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
        console.log(error)
      );
    }

    return NextResponse.json({
      success: true,
      lodge: { id: docSnap.id, ...docSnap.data() },
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
      console.log(error)
    );
  }
}
