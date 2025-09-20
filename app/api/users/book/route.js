import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { amount, lodgeId } = body;

        // Validate required fields
        if (!amount || !lodgeId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Paystack initialization
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!paystackSecretKey) {
            return NextResponse.json(
                { error: "Paystack secret key is not configured" },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                amount, // in kobo
                metadata: { lodgeId },
                callback_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/payment-callback`,
            }),
        });

        const data = await response.json();

        if (data.status) {
            // Return Paystack authorization URL to frontend WebView
            return NextResponse.json({ authorizationUrl: data.data.authorization_url });
        } else {
            return NextResponse.json(
                { error: data.message || "Paystack initialization failed" },
                { status: 400 }
            );
        }
    } catch (err) {
        console.error("Paystack API error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
