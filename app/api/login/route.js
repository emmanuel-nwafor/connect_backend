import { auth, googleProvider, signInWithEmailAndPassword, signInWithPopup } from '@/lib/firebase';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();
    if (!email || (isGoogle ? false : !password)) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }

    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }
    const user = userCredential.user;

    return new Response(JSON.stringify({ message: 'Login successful', uid: user.uid }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}