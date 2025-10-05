import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  try {
    // Lodges Collection
    const lodgesCol = collection(db, "lodges");
    const lodgesSnapshot = await getDocs(lodgesCol);
    const lodges = lodgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let results = lodges;

    if (q && q.trim() !== "") {
      const searchQuery = q.toLowerCase();
      results = lodges.filter(lodge =>
        lodge.title?.toLowerCase().includes(searchQuery) ||
        lodge.description?.toLowerCase().includes(searchQuery) ||
        lodge.location?.toLowerCase().includes(searchQuery) ||
        lodge.propertyType?.toLowerCase().includes(searchQuery) ||
        lodge.category?.toLowerCase().includes(searchQuery)
      );
    }

    // fallback: if nothing matches, return all lodges
    if (results.length === 0) {
      results = lodges;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
