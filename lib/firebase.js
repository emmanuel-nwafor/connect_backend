import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,  
  updatePassword           
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,  
  updatePassword           
};

export default app;
