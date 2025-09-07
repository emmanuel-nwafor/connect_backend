// pages/api/admin/upload-lodges.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// ---- Multer setup (memory storage, no temp files)
const upload = multer({ storage: multer.memoryStorage() });

// ---- Firebase Client SDK init ----
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}
const db = getFirestore(firebaseApp);

// ---- Cloudinary config ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// ---- Helper: upload buffer to Cloudinary ----
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// ---- Disable Next.js default body parsing ----
export const config = {
  api: {
    bodyParser: false,
  },
};

// ---- API Handler ----
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Wrap multer in a promise to use async/await
    const { files, fields } = await new Promise((resolve, reject) => {
      upload.array("files", 12)(req, {}, (err) => {
        if (err) return reject(err);
        resolve({ files: req.files || [], fields: req.body || {} });
      });
    });

    const { title, description, rentFee } = fields;
    if (!title || !description || !rentFee) {
      return res.status(400).json({ error: "title, description and rentFee are required" });
    }

    if (!files.length) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    const imageUrls = [];
    const videoUrls = [];

    for (const file of files) {
      const mimetype = file.mimetype || "";
      const isImage = mimetype.startsWith("image/");
      const isVideo = mimetype.startsWith("video/");

      const folder = isImage ? "lodges/images" : isVideo ? "lodges/videos" : "lodges/others";

      const options = {
        folder,
        resource_type: isVideo ? "video" : "image",
      };

      const result = await uploadBufferToCloudinary(file.buffer, options);

      if (isImage) imageUrls.push(result.secure_url);
      else if (isVideo) videoUrls.push(result.secure_url);
      else imageUrls.push(result.secure_url);
    }

    const lodgeData = {
      title,
      description,
      rentFee,
      imageUrls,
      videoUrls,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "lodges"), lodgeData);

    return res.status(200).json({
      message: "Lodge uploaded successfully",
      lodgeId: docRef.id,
      lodge: { id: docRef.id, ...lodgeData },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
}
