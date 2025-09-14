import { auth, db, googleProvider, signInWithEmailAndPassword, signInWithPopup } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();

    if (!email || (!isGoogle && !password)) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }

    // Authenticate user
    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;

    // Fetch user document
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return new Response(JSON.stringify({ error: 'User not found in database' }), { status: 404 });
    }

    const userData = userDocSnap.data();
    const { role, isFirstTime } = userData;

    // If first-time login, return flag
    if (isFirstTime) {
      return new Response(JSON.stringify({ uid: user.uid, role, isFirstTime: true }), { status: 200 });
    }

    // Regular login
    return new Response(JSON.stringify({ uid: user.uid, role, isFirstTime: false }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
