// app/api/ai-chat/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, lodge } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Limit message length to prevent abuse
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // Extract lodge info safely
    const safeLodge = {
      id: lodge?.id || "N/A",
      title: lodge?.title || "N/A",
      rentFee: lodge?.rentFee || "N/A",
      category: lodge?.category || "N/A",
      location: lodge?.location || "N/A",
      description: lodge?.description ? lodge.description.slice(0, 800) : "",
      status: lodge?.status || "available",
    };

    // System prompt (defines assistant behavior)
    const systemPrompt = `
You are "Connect Assistant" — a concise, friendly, and professional property assistant.
You answer user questions about lodges, apartments, lands, or shops using the provided data.
If the user asks about booking or availability, check the "status" field and respond accordingly.
If the data isn't provided, respond honestly that you don't have that info, and suggest contacting support or checking listings.
Be short, clear, and helpful. Never make up fake info.
`;

    // Combine lodge data + user message
    const userPrompt = `
Lodge Data:
${JSON.stringify(safeLodge, null, 2)}

User Question:
${message}
`;

    // Send to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Error:", errorText);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
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
