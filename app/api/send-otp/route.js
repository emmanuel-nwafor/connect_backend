import { auth } from "@/lib/firebase";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { email } = req.json();
    if (!email) return NextResponse.json({ error: "Email is required"  }, { ststus: 400 });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
        service: 'gmail', // e.g gmail or SMTP
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code for verification',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    })

    // Store OTP in memory or database (e.g., Redis, Firestore) with expiration
    // For simplicity, assume it's returned here (in production, store securely)
    return new Response(JSON.stringify({ otp }), { status: 200 });
}