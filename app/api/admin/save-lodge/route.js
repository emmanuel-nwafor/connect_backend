// pages/api/admin/save-lodge.js
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { title, description, rentFee, imageUrl, videoUrl } = req.body;

    if (!title || !description || !rentFee || !imageUrl) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const docRef = await addDoc(collection(db, "lodges"), {
      title,
      description,
      rentFee,
      imageUrl,
      videoUrl: videoUrl || null,
      createdAt: serverTimestamp(),
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("Firestore save failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
