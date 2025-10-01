import { auth, db, googleProvider, signInWithEmailAndPassword, signInWithPopup } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();

    if (!email || (!isGoogle && !password)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Login with Firebase Auth
    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;
    const docRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(docRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const data = userDoc.data();

    if (!data.profileCompleted) {
      return NextResponse.json({ error: 'Please complete your profile first', redirect: '/setup' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Login successful',
      uid: user.uid,
      role: data.role,
      redirect: '/users'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
