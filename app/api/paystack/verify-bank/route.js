import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const { accountNumber, bankCode } = await req.json();
    if (!accountNumber || !bankCode) {
      return NextResponse.json({ success: false, message: "Missing account details" }, { status: 400 });
    }

    // Call Paystack API
    const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({
        success: false,
        message: data.message || "Unable to verify bank account.",
      });
    }

    return NextResponse.json({
      success: true,
      account_name: data.data.account_name,
      account_number: data.data.account_number,
      bank_code: data.data.bank_code,
    });
  } catch (err) {
    console.error("Bank verification error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
