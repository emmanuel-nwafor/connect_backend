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
You are "Connect Assistant" — a concise, friendly, and professional property assistant.
You answer user questions about lodges, apartments, lands, or shops using the provided data.
If the user asks about booking or availability, check the "status" field and respond accordingly.
Be honest when info is missing. Do not invent details.
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
