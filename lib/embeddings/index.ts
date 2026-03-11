/**
 * Embedding utilities using OpenAI text-embedding-3-small.
 *
 * Used for:
 * - Generating per-segment embeddings at upload time (stored in MongoDB)
 * - Embedding user queries at search time (for cosine similarity lookup)
 *
 * Why OpenAI embeddings instead of keyword search:
 * - Semantic: "What motivated the protagonist?" finds relevant passages even
 *   if the exact words don't appear in the segment.
 * - No text index dependency: works without a MongoDB Atlas text index.
 * - Consistent: same model embeds both documents and queries.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBED_MODEL = "text-embedding-3-small"; // 1536-dim, fast, cheap

/**
 * Embed an array of texts. Returns one embedding vector per input text.
 * Texts are processed in a single API call (OpenAI supports batch input).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings API error (${res.status}): ${err}`);
  }

  const json = await res.json();

  // OpenAI returns data in order but we sort by index to be safe
  return (json.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Embed a single text string. */
export async function embedText(text: string): Promise<number[]> {
  const results = await embedTexts([text]);
  return results[0];
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] where 1 = identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Embed all texts in batches to stay well within OpenAI rate limits.
 * Returns one embedding per input text, preserving order.
 */
export async function embedInBatches(
  texts: string[],
  batchSize = 20
): Promise<Array<number[] | null>> {
  const results: Array<number[] | null> = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await embedTexts(batch);
    embeddings.forEach((emb, j) => {
      results[i + j] = emb;
    });
  }

  return results;
}
