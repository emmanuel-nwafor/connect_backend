import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req) {
  const { otp } = await req.json();
  console.log('Received OTP for verification:', otp);

  if (!otp) {
    console.log('OTP is missing from request body');
    return new Response(JSON.stringify({ error: 'OTP is required' }), { status: 400 });
  }

  try {
    // Attempt to get the stored OTP document
    const otpDoc = await getDoc(doc(db, 'otp-verification', 'current-otp')); // Match the ID used in /send-otp
    console.log('Firestore document exists:', otpDoc.exists());

    if (!otpDoc.exists()) {
      console.log('No OTP document found in Firestore');
      return new Response(JSON.stringify({ error: 'No OTP record found' }), { status: 400 });
    }

    const storedOtp = otpDoc.data().otp;
    console.log('Stored OTP from Firestore:', storedOtp);

    // Convert provided OTP to string for consistent comparison
    const providedOtp = otp.toString();
    console.log('Converted provided OTP:', providedOtp);

    if (providedOtp === storedOtp && providedOtp.length === 4) {
      console.log('OTP verification successful');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      console.log('OTP mismatch or invalid length:', { provided: providedOtp, stored: storedOtp });
      return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return new Response(JSON.stringify({ error: 'Failed to verify OTP', details: error.message }), { status: 500 });
  }
}