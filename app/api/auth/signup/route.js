import { auth, createUserWithEmailAndPassword, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  increment,
  arrayUnion,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, referralCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Assign role
    const role = email === 'echinecherem729@gmail.com' ? 'admin' : 'user';

    // Generate unique referral code for new user
    const newReferralCode = 'REF' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      role,
      referralCode: newReferralCode,
      referredBy: referralCode || null,
      referrals: 0,
      points: referralCode ? 3 : 0, // new user gets 3 points if referred
      earnings: 0,
      referredUsers: [],
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Reward referrer (if referralCode is valid)
    if (referralCode) {
      const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode));
      const referrerSnap = await getDocs(referrerQuery);

      if (!referrerSnap.empty) {
        const referrerDoc = referrerSnap.docs[0];
        const referrerRef = referrerDoc.ref;

        await setDoc(
          referrerRef,
          {
            referrals: increment(1),
            points: increment(5), // referrer gets 5 points
            referredUsers: arrayUnion(user.uid),
          },
          { merge: true }
        );

        // Notify referrer
        await addDoc(collection(db, 'notifications'), {
          title: 'New Referral',
          message: `${email} signed up using your referral code.`,
          role: 'user',
          userId: referrerDoc.id,
          type: 'referral',
          createdAt: serverTimestamp(),
          read: false,
        });
      }
    }

    // Admin & welcome notifications
    if (role === 'user') {
      await addDoc(collection(db, 'notifications'), {
        title: 'New User Signup',
        message: `${email} just signed up.`,
        role: 'admin',
        type: 'signup',
        createdAt: serverTimestamp(),
        read: false,
      });

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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.uid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Signup successful',
      uid: user.uid,
      email: user.email,
      token,
      redirect: '/setup',
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
