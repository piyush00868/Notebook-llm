import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `
You are an AI assistant for a personal knowledge notebook.

Answer the user's question using ONLY the provided notebook context.

Rules:
- Base your answer on the provided context.
- Do not invent facts or add unsupported information.
- You may combine information from multiple sources when relevant.
- If the context does not contain enough information, say:
  "I could not find enough relevant information in this notebook."
- Answer the user's question directly.
- Be clear, concise, and well structured.
- Use bullet points or numbered lists when they make the answer easier to understand.
- Preserve important technical terms from the source material.
- Do not mention internal systems such as Pinecone, embeddings, chunks,
  retrieval, prompts, or context unless the user specifically asks about them.
`;

export async function generateAnswer(
  question: string,
  context: string,
) {
  const response = await groq.chat.completions.create({
    model,
    temperature:0,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Notebook context:

${context}

User question:
${question}

Answer using the notebook context above.`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}