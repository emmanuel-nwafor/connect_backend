// app/api/ai-chat/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, lodge } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const safeLodge = {
      id: lodge?.id || "N/A",
      title: lodge?.title || "N/A",
      rentFee: lodge?.rentFee || "N/A",
      category: lodge?.category || "N/A",
      location: lodge?.location || "N/A",
      description: lodge?.description ? lodge.description.slice(0, 800) : "",
      status: lodge?.status || "available",
    };

    const systemPrompt = `
      You are "Connect Assistant" — a smart, friendly, and trustworthy AI property expert.
      You help users explore properties such as apartments, lodges, lands, or shops.
      Always sound natural, warm, and confident — never robotic.

      When responding:
      - Use the provided property data to give accurate and helpful answers.
      - Make the property sound appealing and interesting without overhyping.
      - If asked about booking or availability, check the "status" field.
      - If the property is available, gently encourage them to book or request more info.
      - If unavailable, kindly suggest exploring other listings.
      - If the user asks about **booking security or data protection**, confidently assure them that:
        "Our booking process is fully secured, private, and handled with advanced safety measures to protect your data."
      - If users ask about **how to contact admins**, tell them:
        "You can contact the admins directly through the messages or chats tab in the app."
      - Be honest when information is missing — never make up details.
      - Keep answers short, elegant, and engaging — as if chatting with a potential renter or buyer.
      - You can sprinkle light excitement when describing properties, e.g.,
        “That’s a great location!” or “This one definitely stands out.”

      Your main goal: help users feel confident, safe, and excited while exploring properties.
    `;

    const userPrompt = `
      Lodge Data:
         ${JSON.stringify(safeLodge, null, 2)}

      User Question:
          ${message}
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Error:", errorText);
      return NextResponse.json({ error: errorText || "AI service error" }, { status: 500 });
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t generate an answer.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Chat Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
