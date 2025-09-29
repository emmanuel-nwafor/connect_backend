import { auth, createUserWithEmailAndPassword, db, googleProvider, signInWithPopup } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';
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

    // Firestore user doc
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Push notifications
    if (role === 'user') {
      // Notify admins
      await addDoc(collection(db, "notifications"), {
        title: "New User Signup",
        message: `${email} just signed up.`,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      // Welcome notification to the user
      await addDoc(collection(db, "notifications"), {
        title: "Welcome!",
        message: `Welcome to the app, ${email}!`,
        role: "user",
        createdAt: serverTimestamp(),
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.uid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Signup successful. Redirect to profile setup.',
      uid: user.uid,
      email: user.email,
      token,
      redirect: '/setup'
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
