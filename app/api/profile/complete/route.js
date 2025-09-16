import express from "express";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js"; // your Firestore init

const router = express.Router();

// Complete Profile
router.post("/complete", async (req, res) => {
    try {
        const { uid, fullName, phone, location, imageUrl } = req.body;

        if (!uid || !fullName || !phone || !location) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const userRef = doc(db, "users", uid);

        // Save profile in Firestore
        await setDoc(
            userRef,
            {
                fullName,
                phone,
                location,
                imageUrl: imageUrl || null,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        res.json({ message: "Profile completed successfully" });
    } catch (err) {
        console.error("Profile completion error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
