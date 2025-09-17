import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const lodgesCol = collection(db, "lodges");
    const lodgesSnap = await getDocs(lodgesCol);

    const lodges = lodgesSnap.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, lodges });
  } catch (error) {
    console.error("Error fetching all lodges:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
