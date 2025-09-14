import { auth, db, googleProvider, signInWithEmailAndPassword, signInWithPopup } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();
    if (!email || (!isGoogle && !password)) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }

    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.exists() ? userDoc.data().role : 'user';

    return new Response(JSON.stringify({ message: 'Login successful', uid: user.uid, role }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
