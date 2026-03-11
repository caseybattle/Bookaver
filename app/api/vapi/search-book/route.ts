import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import Segment from "@/lib/db/models/Segment";

// RAG endpoint called by Vapi assistant to search book content
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, query } = body as { bookId: string; query: string };

    console.log(`[search-book] bookId=${bookId} query="${query}"`);

    if (!bookId || !query) {
      return NextResponse.json({ error: "bookId and query are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Validate bookId format — must be a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.warn(`[search-book] invalid bookId format: ${bookId}`);
      return NextResponse.json({ context: "", count: 0 });
    }

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // 1. Try MongoDB full-text search first (requires text index on content)
    let segments: Array<{ content: string; pageNumber?: number; chunkIndex: number }> = [];

    try {
      segments = await Segment.find(
        { bookId: bookObjectId, $text: { $search: query } },
        { score: { $meta: "textScore" }, content: 1, pageNumber: 1, chunkIndex: 1 }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(5)
        .lean();

      console.log(`[search-book] text search found ${segments.length} segments`);
    } catch (textErr) {
      // Text index may not exist yet — fall back to keyword scan
      console.warn("[search-book] text search failed, falling back to regex:", textErr);
    }

    // 2. Fallback: regex search across all segments for this book
    if (segments.length === 0) {
      // Build a simple regex from significant query words (skip short stop words)
      const words = query
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5);

      const regexPattern = words.length > 0 ? words.join("|") : query;

      try {
        segments = await Segment.find(
          { bookId: bookObjectId, content: { $regex: regexPattern, $options: "i" } },
          { content: 1, pageNumber: 1, chunkIndex: 1 }
        )
          .limit(5)
          .lean();

        console.log(`[search-book] regex fallback found ${segments.length} segments`);
      } catch (regexErr) {
        console.error("[search-book] regex fallback also failed:", regexErr);
      }
    }

    // 3. Last resort: return the first 3 segments of the book for context
    if (segments.length === 0) {
      segments = await Segment.find({ bookId: bookObjectId })
        .sort({ chunkIndex: 1 })
        .limit(3)
        .lean();

      console.log(`[search-book] using first ${segments.length} segments as last resort`);
    }

    const context = segments
      .map((s) => `[Page ${s.pageNumber ?? "?"}, Segment ${s.chunkIndex}]\n${s.content}`)
      .join("\n\n---\n\n");

    console.log(`[search-book] returning ${segments.length} segments, context length ${context.length}`);

    return NextResponse.json({ context, count: segments.length });
  } catch (err) {
    console.error("[search-book] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
