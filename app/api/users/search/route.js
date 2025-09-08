import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return new Response(JSON.stringify({ success: false, message: "Missing query" }), { status: 400 });

  const searchQuery = q.toLowerCase();

  try {
    // Users Collection
    // const usersCol = collection(db, "users");
    // const usersQuery = query(
    //   usersCol,
    //   where("name_lowercase", ">=", searchQuery),
    //   where("name_lowercase", "<=", searchQuery + "\uf8ff")
    // );
    // const usersSnapshot = await getDocs(usersQuery);
    // const users = usersSnapshot.docs.map(doc => ({ id: doc.id, type: "User", ...doc.data() }));

    // Lodges Collection
    const lodgesCol = collection(db, "lodges");
    const lodgesQuery = query(
      lodgesCol,
      where("title_lowercase", ">=", searchQuery),
      where("title_lowercase", "<=", searchQuery + "\uf8ff")
    );
    const lodgesSnapshot = await getDocs(lodgesQuery);
    const lodges = lodgesSnapshot.docs.map(doc => ({ id: doc.id, type: "Lodge", ...doc.data() }));

    // Users Notifications Collection
    const notifCol = collection(db, "users-notifications");
    const notifQuery = query(
      notifCol,
      where("message_lowercase", ">=", searchQuery),
      where("message_lowercase", "<=", searchQuery + "\uf8ff")
    );
    const notifSnapshot = await getDocs(notifQuery);
    const notifications = notifSnapshot.docs.map(doc => ({ id: doc.id, type: "Notification", ...doc.data() }));

    const results = [...users, ...lodges, ...notifications];

    return new Response(JSON.stringify({ success: true, results }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, message: "Internal server error" }), { status: 500 });
  }
}
