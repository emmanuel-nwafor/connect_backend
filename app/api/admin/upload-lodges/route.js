// pages/api/admin/save-lodge.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let firebaseApp;
if (!getApps().length) firebaseApp = initializeApp(firebaseConfig);
else firebaseApp = getApps()[0];
const db = getFirestore(firebaseApp);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, description, rentFee, imageUrl, videoUrl, imagePublicId, videoPublicId } = req.body || {};
    if (!title || !description || !rentFee || !imageUrl || !videoUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lodge = {
      title,
      description,
      rentFee,
      imageUrl,
      videoUrl,
      imagePublicId: imagePublicId || null,
      videoPublicId: videoPublicId || null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'lodges'), lodge);
    return res.status(200).json({ message: 'Saved', lodgeId: docRef.id });
  } catch (err) {
    console.error('save-lodge error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
