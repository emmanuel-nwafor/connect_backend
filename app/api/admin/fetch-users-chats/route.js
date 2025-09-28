import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET() {
    try {
        // Fetch only users with role "user"
        const q = query(collection(db, "users"), where("role", "==", "user"));
        const querySnapshot = await getDocs(q);

        const usersData = querySnapshot.docs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,
                fullName: data.fullName || "Unknown User",
                email: data.email || "N/A",
                initials: data.fullName
                    ? data.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "NA",
                createdAt: data.createdAt?.toDate?.().toLocaleDateString() || "N/A",
                imageUrl: data.imageUrl || null,
            };
        });

        console.log("Fetched users for chat:", usersData);

        return new Response(JSON.stringify({ success: true, users: usersData }), {
            status: 200,
        });
    } catch (error) {
        console.error("Failed to fetch users for chat:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Failed to fetch users" }),
            { status: 500 }
        );
    }
}
