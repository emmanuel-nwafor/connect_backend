import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing query" }),
      { status: 400 }
    );
  }

  const searchQuery = q.toLowerCase();

  try {
    // Lodges Collection
    const lodgesCol = collection(db, "lodges");
    const lodgesQuery = query(
      lodgesCol,
      where("title_lowercase", ">=", searchQuery),
      where("title_lowercase", "<=", searchQuery + "\uf8ff")
    );

    const lodgesSnapshot = await getDocs(lodgesQuery);

    const lodges = lodgesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        location: data.location || "",
        rentFee: data.rentFee || "",
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        category: data.category || "",
        propertyType: data.propertyType || "",
        imageUrls: data.imageUrls || [],
        createdAt: data.createdAt || null,
      };
    });

    return new Response(JSON.stringify({ success: true, results: lodges }), {
      status: 200,
    });
  } catch (err) {
    console.error("Search error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
