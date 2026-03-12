import { describe, it, expect } from "vitest";
import { chunkText, CHUNK_WORD_LIMIT } from "@/lib/pdf/chunk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a string of exactly `n` distinct words. */
function makeWords(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
}

// ---------------------------------------------------------------------------
// CHUNK_WORD_LIMIT constant
// ---------------------------------------------------------------------------
describe("CHUNK_WORD_LIMIT", () => {
  it("is 500", () => {
    expect(CHUNK_WORD_LIMIT).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// chunkText
// ---------------------------------------------------------------------------
describe("chunkText", () => {
  it("returns 0 chunks for an empty string", () => {
    // "".split(/\s+/) → [""] → chunk = "" → trimmed falsy → not pushed
    expect(chunkText("")).toHaveLength(0);
  });

  it("returns 0 chunks for a whitespace-only string", () => {
    expect(chunkText("   \n\t  ")).toHaveLength(0);
  });

  it("returns 1 chunk for a short text (< 500 words)", () => {
    const text = makeWords(10);
    const result = chunkText(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it("returns 1 chunk for exactly 500 words", () => {
    const text = makeWords(500);
    const result = chunkText(text);
    expect(result).toHaveLength(1);
  });

  it("returns 1 chunk for a single word", () => {
    expect(chunkText("hello")).toHaveLength(1);
    expect(chunkText("hello")[0]).toBe("hello");
  });

  it("returns 2 chunks for 501 words", () => {
    const text = makeWords(501);
    const result = chunkText(text);
    expect(result).toHaveLength(2);
    // First chunk = 500 words, second chunk = 1 word
    expect(result[0].split(" ")).toHaveLength(500);
    expect(result[1].split(" ")).toHaveLength(1);
  });

  it("returns 2 chunks for exactly 1000 words", () => {
    const text = makeWords(1000);
    const result = chunkText(text);
    expect(result).toHaveLength(2);
    expect(result[0].split(" ")).toHaveLength(500);
    expect(result[1].split(" ")).toHaveLength(500);
  });

  it("returns 3 chunks for 1001 words", () => {
    const text = makeWords(1001);
    expect(chunkText(text)).toHaveLength(3);
  });

  it("returns the correct number of chunks for a very long text (5000 words)", () => {
    const text = makeWords(5000);
    const result = chunkText(text);
    expect(result).toHaveLength(10); // 5000 / 500 = 10 even chunks
    for (const chunk of result) {
      expect(chunk.split(" ")).toHaveLength(500);
    }
  });

  it("trims leading/trailing whitespace from each chunk", () => {
    const text = "  " + makeWords(5) + "  ";
    const result = chunkText(text);
    expect(result[0]).not.toMatch(/^\s/);
    expect(result[0]).not.toMatch(/\s$/);
  });

  it("collapses internal whitespace — each word separated by single space", () => {
    const text = "hello   world\n\tfoo";
    const result = chunkText(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("hello world foo");
  });

  it("preserves all words when reassembled", () => {
    const wordList = Array.from({ length: 750 }, (_, i) => `w${i}`);
    const text = wordList.join(" ");
    const chunks = chunkText(text);
    // Reassemble and check word count
    const allWords = chunks.flatMap((c) => c.split(" "));
    expect(allWords).toHaveLength(750);
    expect(allWords).toEqual(wordList);
  });

  it("formula: Math.ceil(n / 500) chunks for any n words", () => {
    const cases = [1, 499, 500, 501, 999, 1000, 1001, 2500];
    for (const n of cases) {
      const result = chunkText(makeWords(n));
      const expected = Math.ceil(n / 500);
      expect(result, `n=${n}`).toHaveLength(expected);
    }
  });
});
