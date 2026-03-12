import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// cosineSimilarity is a pure function — import it statically (no env vars needed)
import { cosineSimilarity } from "@/lib/embeddings";

// ---------------------------------------------------------------------------
// cosineSimilarity — pure math, no mocking needed
// ---------------------------------------------------------------------------
describe("cosineSimilarity (pure math)", () => {
  it("identical vectors return 1.0", () => {
    const v = [1, 2, 3];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 10);
  });

  it("identical non-unit vectors still return 1.0", () => {
    const v = [3, 4, 0];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 10);
  });

  it("orthogonal vectors return 0.0", () => {
    // [1,0] · [0,1] = 0
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0, 10);
  });

  it("opposite vectors return -1.0", () => {
    const v = [1, 2, 3];
    const neg = v.map((x) => -x);
    expect(cosineSimilarity(v, neg)).toBeCloseTo(-1.0, 10);
  });

  it("returns 0 for empty vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("returns 0 when lengths differ", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("returns 0 when both vectors are zero vectors", () => {
    // denom = 0 → guarded divide → 0
    expect(cosineSimilarity([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it("returns 0 when one vector is a zero vector", () => {
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0);
  });

  it("known pair: [3,4] vs [4,3] → 24/25 = 0.96", () => {
    // dot = 3*4 + 4*3 = 24; |[3,4]| = |[4,3]| = 5; cos = 24/25
    expect(cosineSimilarity([3, 4], [4, 3])).toBeCloseTo(0.96, 5);
  });

  it("1-d unit vectors pointing same direction → 1.0", () => {
    expect(cosineSimilarity([5], [5])).toBeCloseTo(1.0, 10);
  });

  it("1-d vectors pointing opposite directions → -1.0", () => {
    expect(cosineSimilarity([5], [-5])).toBeCloseTo(-1.0, 10);
  });

  it("result stays in [-1, 1] for arbitrary vectors", () => {
    const a = [0.2, -0.5, 0.8, 0.1, -0.3];
    const b = [-0.4, 0.6, 0.1, -0.9, 0.7];
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it("is commutative: sim(a,b) === sim(b,a)", () => {
    const a = [1, 2, 3, 4];
    const b = [4, 3, 2, 1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });

  it("high-dimensional unit vectors (1536-d) return 1.0", () => {
    const dim = 1536;
    const magnitude = Math.sqrt(dim);
    const v = Array.from({ length: dim }, () => 1 / magnitude);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });
});

// ---------------------------------------------------------------------------
// embedTexts / embedText — these call OpenAI; we mock fetch.
//
// IMPORTANT: lib/embeddings/index.ts captures OPENAI_API_KEY at module
// evaluation time:
//   const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
//
// Setting process.env in beforeEach is too late once the module is cached.
// We use vi.resetModules() + dynamic import() so each test that needs a
// fresh env gets a freshly-evaluated module.
// ---------------------------------------------------------------------------

const FAKE_EMB_A = [0.0, 0.1, 0.2, 0.3, 0.4];
const FAKE_EMB_B = [0.2, 0.4, 0.6, 0.8, 1.0];

function fakeOAIResponse(embeddings: number[][]): object {
  return {
    object: "list",
    data: embeddings.map((embedding, index) => ({
      object: "embedding",
      index,
      embedding,
    })),
    model: "text-embedding-3-small",
    usage: { prompt_tokens: 5, total_tokens: 5 },
  };
}

describe("embedTexts (mocked fetch)", () => {
  beforeEach(() => {
    // Set env var BEFORE the dynamic import so the module captures it
    process.env.OPENAI_API_KEY = "test-key-abc123";
    vi.stubGlobal("fetch", vi.fn());
    vi.resetModules(); // ensure fresh module evaluation on next import
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns [] for empty input without calling fetch", async () => {
    const { embedTexts } = await import("@/lib/embeddings");
    const result = await embedTexts([]);
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calls the OpenAI embeddings endpoint with correct body", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeOAIResponse([FAKE_EMB_A]),
    } as Response);

    const { embedTexts } = await import("@/lib/embeddings");
    await embedTexts(["hello world"]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/embeddings");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe("text-embedding-3-small");
    expect(body.input).toEqual(["hello world"]);
    expect(body.encoding_format).toBe("float");
  });

  it("sends Authorization header with Bearer token", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeOAIResponse([FAKE_EMB_A]),
    } as Response);

    const { embedTexts } = await import("@/lib/embeddings");
    await embedTexts(["test"]);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-key-abc123");
  });

  it("returns embeddings sorted by index regardless of API response order", async () => {
    const mockFetch = vi.mocked(fetch);
    // Return data reversed to test the sort-by-index logic
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { index: 1, embedding: FAKE_EMB_B },
          { index: 0, embedding: FAKE_EMB_A },
        ],
      }),
    } as Response);

    const { embedTexts } = await import("@/lib/embeddings");
    const result = await embedTexts(["first", "second"]);
    expect(result[0]).toEqual(FAKE_EMB_A);
    expect(result[1]).toEqual(FAKE_EMB_B);
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    vi.resetModules();
    const { embedTexts } = await import("@/lib/embeddings");
    await expect(embedTexts(["test"])).rejects.toThrow("OPENAI_API_KEY");
  });

  it("throws with status code on non-OK API response", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limit exceeded",
    } as Response);

    const { embedTexts } = await import("@/lib/embeddings");
    await expect(embedTexts(["test"])).rejects.toThrow("429");
  });
});

describe("embedText (mocked fetch)", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key-xyz";
    vi.stubGlobal("fetch", vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns a single embedding vector for one text", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeOAIResponse([FAKE_EMB_A]),
    } as Response);

    const { embedText } = await import("@/lib/embeddings");
    const result = await embedText("singleton text");
    expect(result).toEqual(FAKE_EMB_A);
  });

  it("calls embedTexts with a single-element array internally", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeOAIResponse([FAKE_EMB_B]),
    } as Response);

    const { embedText } = await import("@/lib/embeddings");
    const result = await embedText("only one");

    // embedText wraps embedTexts(["only one"]) — fetch called once
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.input).toEqual(["only one"]);
    expect(result).toEqual(FAKE_EMB_B);
  });
});
