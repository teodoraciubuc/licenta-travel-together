const CHAT_MODEL = "llama-3.3-70b-versatile";
const TRAVEL_TOGETHER_SYSTEM_PROMPT = `
You are the Travel Together assistant.
You only help with:
- general travel planning guidance
- explanations about destinations, transport, accommodation, packing, budgeting, and trip organization
- help using the Travel Together application

Important limits:
- Do not claim to modify the database, itineraries, maps, recommendations, accounts, or application settings.
- Do not say you saved conversations or user data.
- Do not perform bookings or transactional actions.
- If a request is outside Travel Together or travel planning, politely redirect the user to supported topics.
- Keep answers practical, concise, and friendly.
`.trim();

let groqClientPromise;

async function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  if (!groqClientPromise) {
    groqClientPromise = import("groq-sdk").then(({ default: Groq }) => (
      new Groq({ apiKey: process.env.GROQ_API_KEY })
    ));
  }

  return groqClientPromise;
}

async function chat(req, res) {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    const groq = await getGroqClient();
    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: TRAVEL_TOGETHER_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim()
      || "I can help with travel planning questions and guidance about using Travel Together.";

    return res.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
}

module.exports = { chat };
