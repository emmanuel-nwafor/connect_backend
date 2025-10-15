import { auth, createUserWithEmailAndPassword, db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create user with Firebase Auth (Email + Password)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Assign role (admin or user)
    const role = email === 'echinecherem729@gmail.com' ? 'admin' : 'user';

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Send notifications
    if (role === 'user') {
      // Notify admins
      await addDoc(collection(db, 'notifications'), {
        title: 'New User Signup',
        message: `${email} just signed up.`,
        role: 'admin',
        userId: null,
        type: 'welcome',
        createdAt: serverTimestamp(),
        read: false,
      });

      // Welcome notification to the user
      await addDoc(collection(db, 'notifications'), {
        title: 'Welcome!',
        message: `Welcome to the app, ${email}!`,
        role: 'user',
        userId: user.uid,
        type: 'welcome',
        createdAt: serverTimestamp(),
        read: false,
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
      redirect: '/setup',
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
