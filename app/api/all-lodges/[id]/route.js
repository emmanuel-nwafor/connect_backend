import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request, { params }) {
  try {
    const { id } = params; // remove "await"

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing lodge ID" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "lodges", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Lodge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lodge: { id: docSnap.id, ...docSnap.data() },
    });
  } catch (error) {
    console.error("Error fetching lodge:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
