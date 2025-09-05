export async function POST(req) {
  const { email, otp } = await req.json();
  if (!email || !otp) return new Response(JSON.stringify({ error: 'Email and OTP are required' }), { status: 400 });

  // Verify OTP (compare with stored value)
  // For simplicity, assume it matches if otp.length === 6 (in production, check against stored OTP)
  if (otp.length === 6) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
}