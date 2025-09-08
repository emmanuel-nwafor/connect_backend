import { db } from "@/lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));

    const usersData = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        email: data.email || "N/A",
        initials: data.name
          ? data.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : "NA",
        createdAt: data.createdAt?.toDate?.().toLocaleDateString() || "N/A",
      };
    });

    console.log("Fetched users:", usersData);

    return new Response(JSON.stringify({ users: usersData }), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch users" }),
      { status: 500 }
    );
  }
}
