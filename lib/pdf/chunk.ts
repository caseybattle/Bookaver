// Pure text-chunking utility — no pdfjs-dist dependency.
// Kept in a separate file so server actions (e.g. catalog.actions.ts) can
// import it without accidentally pulling in pdfjs's @napi-rs native bindings,
// which crash in Vercel serverless functions.

export const CHUNK_WORD_LIMIT = 500;

export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += CHUNK_WORD_LIMIT) {
    const chunk = words.slice(i, i + CHUNK_WORD_LIMIT).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
  }
  return chunks;
}
