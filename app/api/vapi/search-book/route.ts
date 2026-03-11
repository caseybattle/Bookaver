import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import Segment from "@/lib/db/models/Segment";

// RAG endpoint called by Vapi assistant to search book content
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookId, query } = body as { bookId: string; query: string };

    if (!bookId || !query) {
      return NextResponse.json({ error: "bookId and query are required" }, { status: 400 });
    }

    await connectToDatabase();

    // MongoDB full-text search on segments belonging to this book
    const segments = await Segment.find(
      {
        bookId,
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
        content: 1,
        pageNumber: 1,
        chunkIndex: 1,
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5)
      .lean();

    const context = segments
      .map((s) => `[Page ${s.pageNumber}, Segment ${s.chunkIndex}]\n${s.content}`)
      .join("\n\n---\n\n");

    return NextResponse.json({ context, count: segments.length });
  } catch (err) {
    console.error("[search-book] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
