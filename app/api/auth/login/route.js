import { auth, db, googleProvider, signInWithEmailAndPassword, signInWithPopup } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();
    console.log("Signup payload:", { email, password, isGoogle });

    if (!email || (!isGoogle && !password)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Firebase login
    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const user = userCredential.user;

    // Check Firestore doc
    const docRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const data = userDoc.data();

    if (!data.profileCompleted) {
      // still return token but with redirect
      const token = jwt.sign(
        { userId: user.uid, email: user.email, role: data.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        error: 'Please complete your profile first',
        redirect: '/setup',
        uid: user.uid,
        email: user.email,
        token,
      }, { status: 403 });
    }

    // ✅ Sign JWT
    const token = jwt.sign(
      { userId: user.uid, email: user.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      uid: user.uid,
      email: user.email,
      role: data.role,
      token, // send JWT
      redirect: '/users',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
