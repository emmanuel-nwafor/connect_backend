import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // --- AUTH CHECK ---
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: "Invalid token" }), { status: 401 });
    }

    // --- CHECK ROLE ---
    if (decoded.role !== "admin") {
      return new Response(JSON.stringify({ success: false, message: "Forbidden: Admins only" }), { status: 403 });
    }

    // --- FETCH USERS ---
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersData = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || "N/A",
        initials: data.fullName
          ? data.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()
          : "NA",
        name: data.fullName,
        profileImage: data.imageUrl,
        createdAt: data.createdAt?.toDate?.().toLocaleDateString() || "N/A",
        role: data.role || "user",
      };
    });

    return new Response(JSON.stringify({ success: true, users: usersData }), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return new Response(JSON.stringify({ success: false, message: "Failed to fetch users" }), { status: 500 });
  }
}
