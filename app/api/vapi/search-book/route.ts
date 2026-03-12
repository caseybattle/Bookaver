import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import Segment from "@/lib/db/models/Segment";
import { embedText, cosineSimilarity } from "@/lib/embeddings";

// RAG endpoint called by Vapi assistant during voice calls.
// Search strategy (in priority order):
//   1. Semantic vector search — embed query, cosine-rank all segment embeddings
//   2. MongoDB full-text keyword search — requires Atlas text index
//   3. Regex scan — works without any index
//   4. First 3 segments — absolute fallback (always returns something)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, query } = body as { bookId: string; query: string };

    console.log(`[search-book] bookId=${bookId} query="${query}"`);

    if (!bookId || !query) {
      return NextResponse.json({ error: "bookId and query are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Validate bookId — must be a real MongoDB ObjectId (not an unresolved {{bookId}} template)
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.warn(`[search-book] invalid bookId (unsubstituted template?): ${bookId}`);
      return NextResponse.json({ context: "", count: 0 });
    }

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    type SegmentLike = { content: string; pageNumber?: number; chunkIndex: number };
    let segments: SegmentLike[] = [];

    // ── Tier 1: Semantic vector search ───────────────────────────────────────
    try {
      const embeddedSegments = await Segment.find(
        { bookId: bookObjectId, embedding: { $exists: true, $ne: [] } }
      )
        .select("+embedding content pageNumber chunkIndex")
        .lean();

      console.log(`[search-book] ${embeddedSegments.length} segments have embeddings`);

      if (embeddedSegments.length > 0) {
        const queryEmbedding = await embedText(query);

        const scored = embeddedSegments
          .map((seg) => ({
            seg,
            score: cosineSimilarity(queryEmbedding, (seg as unknown as { embedding: number[] }).embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        segments = scored.map((s) => s.seg as unknown as SegmentLike);

        console.log(
          `[search-book] vector search: ${segments.length} results, top score=${scored[0]?.score.toFixed(3)}`
        );
      }
    } catch (vecErr) {
      console.warn("[search-book] vector search failed, falling back:", vecErr);
    }

    // ── Tier 2: MongoDB full-text keyword search ──────────────────────────────
    if (segments.length === 0) {
      try {
        segments = await Segment.find(
          { bookId: bookObjectId, $text: { $search: query } },
          { score: { $meta: "textScore" }, content: 1, pageNumber: 1, chunkIndex: 1 }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(5)
          .lean();

        console.log(`[search-book] text search: ${segments.length} results`);
      } catch (textErr) {
        console.warn("[search-book] text search failed:", textErr);
      }
    }

    // ── Tier 3: Regex keyword scan ────────────────────────────────────────────
    if (segments.length === 0) {
      const words = query.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
      const regexPattern = words.length > 0 ? words.join("|") : query;

      try {
        segments = await Segment.find(
          { bookId: bookObjectId, content: { $regex: regexPattern, $options: "i" } },
          { content: 1, pageNumber: 1, chunkIndex: 1 }
        )
          .limit(5)
          .lean();

        console.log(`[search-book] regex scan: ${segments.length} results`);
      } catch (regexErr) {
        console.error("[search-book] regex scan failed:", regexErr);
      }
    }

    // ── Tier 4: First 3 segments (absolute last resort) ───────────────────────
    if (segments.length === 0) {
      segments = await Segment.find({ bookId: bookObjectId })
        .sort({ chunkIndex: 1 })
        .limit(3)
        .lean();

      console.log(`[search-book] last resort: returning first ${segments.length} segments`);
    }

    const context = segments
      .map((s) => `[Page ${s.pageNumber ?? "?"}, Segment ${s.chunkIndex}]\n${s.content}`)
      .join("\n\n---\n\n");

    console.log(`[search-book] returning ${segments.length} segments (${context.length} chars)`);

    return NextResponse.json({ context, count: segments.length });
  } catch (err) {
    console.error("[search-book] unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
