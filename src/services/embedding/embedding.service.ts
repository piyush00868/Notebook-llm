import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function generateEmbeddings(texts: string[]) {
  if (texts.length === 0) {
    return [];
  }

  const response = await mistral.embeddings.create({
    model: "mistral-embed",
    inputs: texts,
  });

  return response.data.map((item) => item.embedding);
}

export async function testEmbedding(text: string) {
  const embedding = await generateEmbeddings([text]);

  console.log("EMBEDDING LENGTH:", embedding.length);
  console.log("FIRST 5 VALUES:", embedding.slice(0, 5));

  return embedding;
}
