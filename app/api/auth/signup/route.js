import { auth, createUserWithEmailAndPassword, db, googleProvider, signInWithPopup } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();

    if (!email || (!isGoogle && !password)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create user with Firebase Auth
    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;
    const role = email === 'echinecherem729@gmail.com' ? 'admin' : 'user';

    // Create minimal Firestore doc
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Signup successful. Redirect to profile setup.',
      uid: user.uid,
      email: user.email,
      redirect: '/setup'
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
