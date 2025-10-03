import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { category } = params;

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Missing category" },
        { status: 400 }
      );
    }

    // "all" means fetch everything
    let q;
    if (category === "all") {
      q = query(collection(db, "lodges"));
    } else {
      q = query(
        collection(db, "lodges"),
        where("category", "==", category)
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: `No properties found for ${category}` },
        { status: 404 }
      );
    }

    const lodges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, lodges });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
