// pages/api/admin/upload-lodges.js
import nextConnect from 'next-connect';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const upload = multer({ storage: multer.memoryStorage() });

/**
 * NOTE: using client Firebase SDK on server (per your request).
 * This relies on your firebase config env vars (not the admin SDK).
 * Ensure Firestore rules allow server-side writes with that config.
 */

// Initialize Firebase (only once)
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

// Cloudinary configuration (uses the names you provided in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY, // note: your .env uses CLOUDINARY_SECRET_KEY
});

// helper: upload a buffer via cloudinary upload_stream
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

const handler = nextConnect({
  onError(err, req, res) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  },
});

// Accept 'files' up to 12 (adjust if needed)
handler.use(upload.array('files', 12));

handler.post(async (req, res) => {
  try {
    // multer has populated req.body (text fields) and req.files (buffers)
    const { title, description, rentFee } = req.body || {};

    if (!title || !description || !rentFee) {
      return res.status(400).json({ error: 'title, description and rentFee are required' });
    }

    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: 'At least one file is required' });
    }

    const imageUrls = [];
    const videoUrls = [];

    // Upload each file to Cloudinary
    for (const file of files) {
      const mimetype = file.mimetype || '';
      const isImage = mimetype.startsWith('image/');
      const isVideo = mimetype.startsWith('video/');

      const folder = isImage ? 'lodges/images' : isVideo ? 'lodges/videos' : 'lodges/others';

      const options = {
        folder,
        resource_type: isVideo ? 'video' : 'image',
        // optional: set eager transformations, quality, etc.
      };

      // upload the buffer
      const result = await uploadBufferToCloudinary(file.buffer, options);

      if (isImage) imageUrls.push(result.secure_url);
      else if (isVideo) videoUrls.push(result.secure_url);
      else imageUrls.push(result.secure_url);
    }

    // Compose lodge record and write to Firestore (client SDK)
    const lodgeData = {
      title,
      description,
      rentFee,
      imageUrls,
      videoUrls,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'lodges'), lodgeData);

    return res.status(200).json({
      message: 'Lodge uploaded successfully',
      lodgeId: docRef.id,
      lodge: { id: docRef.id, ...lodgeData },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export const config = {
  api: {
    bodyParser: false, // Important: multer handles multipart parsing
  },
};

export default handler;
