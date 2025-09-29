import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef,
            where("role", "in", ["user", "all"]),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const snapshot = await getDocs(q);
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ success: true, notifications });
    } catch (err) {
        console.error("Error fetching user notifications:", err);
        return NextResponse.json({ success: false, message: "Failed to fetch notifications." }, { status: 500 });
    }
}
