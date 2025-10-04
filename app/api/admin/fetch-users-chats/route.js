import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

export async function GET() {
    try {
        // Fetch only users with role "user"
        const q = query(collection(db, "users"), where("role", "==", "user"));
        const querySnapshot = await getDocs(q);

        const usersData = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const data = doc.data();

                // Fetch last message for this user
                const chatQuery = query(
                    collection(db, "chats"),
                    where("senderId", "==", doc.id),
                    orderBy("createdAt", "desc"),
                    limit(1)
                );
                const chatSnapshot = await getDocs(chatQuery);

                let lastMessage = null;
                if (!chatSnapshot.empty) {
                    lastMessage = chatSnapshot.docs[0].data().message || null;
                }

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
                    lastMessage,
                };
            })
        );

        console.log("Fetched users with last messages:", usersData);

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
