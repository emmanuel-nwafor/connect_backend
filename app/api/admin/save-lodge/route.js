// pages/api/admin/save-lodge.js
import { db } from "@/lib/firebase"; // initialized Firestore
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { title, description, rentFee, imageUrl, videoUrl } = req.body;

  if (!title || !description || !rentFee || !imageUrl) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const lodgeRef = await addDoc(collection(db, "lodges"), {
      title,
      description,
      rentFee,
      imageUrl,
      videoUrl: videoUrl || null,
      createdAt: serverTimestamp(),
    });

    res.status(200).json({ success: true, message: "Lodge saved successfully", id: lodgeRef.id });
  } catch (error) {
    console.error("Error saving lodge:", error);
    res.status(500).json({ success: false, error: "Failed to save lodge" });
  }
}
