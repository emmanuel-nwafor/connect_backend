// app/api/users/lodges/route.js
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
  try {
    // Reference the "lodges" collection
    const lodgesRef = collection(db, "lodges");

    // Optional: order by createdAt descending
    const q = query(lodgesRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);

    const lodges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(JSON.stringify({ success: true, lodges }), {
      status: 200,
    });
  } catch (err) {
    console.error("Failed to fetch lodges:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to fetch lodges",
      }),
      { status: 500 }
    );
  }
}
