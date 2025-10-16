import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const data = await res.json();
    return NextResponse.json({ success: true, banks: data.data });
  } catch (err) {
    console.error("Fetch banks error:", err);
    return NextResponse.json({ success: false, message: "Unable to fetch banks" }, { status: 500 });
  }
}
