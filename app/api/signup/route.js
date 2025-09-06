import { NextResponse } from 'next/server';
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithPopup } from '@/lib/firebase'; 

export async function POST(req) {
  try {
    const { email, password, isGoogle = false } = await req.json();
    if (!email || (!isGoogle && !password)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate password requirements on backend
    if (!isGoogle) {
      const requirements = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        specialChar: /[!@#$%^&*]/.test(password),
      };
      if (!Object.values(requirements).every(Boolean)) {
        return NextResponse.json({ error: 'Password must meet all requirements: 8+ chars, uppercase, lowercase, number, special char' }, { status: 400 });
      }
    }

    let userCredential;
    if (isGoogle) {
      userCredential = await signInWithPopup(auth, googleProvider);
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    }
    const user = userCredential.user;

    // Assign role (default to 'user')
    const role = 'user';
    // Note: Role assignment requires Admin SDK for custom claims

    return NextResponse.json({ message: 'User created successfully', uid: user.uid, role }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}