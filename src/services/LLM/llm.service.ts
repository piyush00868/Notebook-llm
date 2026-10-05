import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

export async function generateAnswer(
  question: string,
  context: string,
) {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful RAG assistant. Answer the user's question using only the provided context. If the context does not contain the answer, say you do not have enough information.",
      },
      {
        role: "user",
        content: `Context:

${context}

Question:
${question}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}