import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q)
    return new Response(
      JSON.stringify({ success: false, message: "Missing query" }),
      { status: 400 }
    );

  const searchQuery = q.toLowerCase();

  try {
    // Lodges Collection
    const lodgesCol = collection(db, "lodges");
    const lodgesQuery = query(
      lodgesCol,
      where("title_lowercase", ">=", searchQuery),
      where("title_lowercase", "<=", searchQuery + "\uf8ff")
    );
    const lodgesSnapshot = await getDocs(collection(db, "lodges"));
    const lodges = lodgesSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(lodge => lodge.title.toLowerCase().includes(searchQuery));


    return new Response(JSON.stringify({ success: true, results: lodges }), {
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
