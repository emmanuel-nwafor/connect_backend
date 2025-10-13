// /api/auth/change-password/route.js
import { auth, signInWithEmailAndPassword, updatePassword } from '@/lib/firebase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, oldPassword, newPassword } = await req.json();

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Re-authenticate user
    const userCredential = await signInWithEmailAndPassword(auth, email, oldPassword);
    const user = userCredential.user;

    // Update password
    await updatePassword(user, newPassword);

    // Generate new JWT
    const token = jwt.sign(
      { userId: user.uid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Password updated successfully',
      token,
      uid: user.uid,
      email: user.email
    }, { status: 200 });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
