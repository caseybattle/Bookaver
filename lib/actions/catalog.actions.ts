"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import Book from "@/lib/db/models/Book";
import Segment from "@/lib/db/models/Segment";
import { getClerkId, getUserPlan, getPlanLimits } from "@/lib/clerk/billing";
import { chunkText } from "@/lib/pdf/chunk";
import {
  GutenbergBook,
  getBookTextUrl,
  getBookCoverUrl,
  getBookAuthor,
  stripGutenbergBoilerplate,
} from "@/lib/gutenberg";
import { embedInBatches } from "@/lib/embeddings";
import { revalidatePath } from "next/cache";

// Cap at ~150 000 words to stay within Vercel's 60-second function timeout
const MAX_WORDS = 150_000;

export async function addGutenbergBook(book: GutenbergBook) {
  const clerkId = await getClerkId();
  await connectToDatabase();

  // ── Billing enforcement ──────────────────────────────────────────────────
  const plan = await getUserPlan();
  const limits = getPlanLimits(plan);
  const currentBookCount = await Book.countDocuments({ clerkId });
  if (limits.books !== Infinity && currentBookCount >= limits.books) {
    throw new Error(
      `Book limit reached. Your ${plan} plan allows ${limits.books} book${limits.books === 1 ? "" : "s"}. Upgrade to add more.`
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  // Check if user already has this book
  const existing = await Book.findOne({
    clerkId,
    title: book.title,
    author: getBookAuthor(book),
  }).lean();
  if (existing) {
    return { success: true, bookId: (existing as { _id: { toString(): string } })._id.toString(), alreadyExists: true };
  }

  const textUrl = getBookTextUrl(book);
  if (!textUrl) {
    throw new Error("No plain-text version available for this book.");
  }

  // Download the book text from Gutenberg
  const textRes = await fetch(textUrl);
  if (!textRes.ok) {
    throw new Error(`Failed to download book text: ${textRes.status}`);
  }
  const rawText = await textRes.text();
  const cleanText = stripGutenbergBoilerplate(rawText);

  // Cap length to avoid timeout
  const words = cleanText.trim().split(/\s+/);
  const cappedText =
    words.length > MAX_WORDS
      ? words.slice(0, MAX_WORDS).join(" ")
      : cleanText;

  // Use the original Gutenberg URL as blobUrl — text is already indexed in MongoDB Segments
  const author = getBookAuthor(book);
  const blobUrl = textUrl;

  const coverUrl = getBookCoverUrl(book) ?? undefined;

  // Create Book record
  const bookDoc = await Book.create({
    clerkId,
    title: book.title,
    author,
    blobUrl,
    ...(coverUrl ? { coverUrl } : {}),
    totalPages: 0,
    totalSegments: 0,
  });

  // Segment the text
  const chunks = chunkText(cappedText);

  const segmentDocs = chunks.map((content, chunkIndex) => ({
    bookId: bookDoc._id,
    clerkId,
    content,
    chunkIndex,
  }));

  await Segment.insertMany(segmentDocs);

  // Update totalSegments
  await Book.findByIdAndUpdate(bookDoc._id, {
    totalSegments: chunks.length,
  });

  // ── Fire-and-forget: generate embeddings in the background ───────────────
  // We do NOT await this — it runs after the response is returned.
  // embedInBatches handles batching (default 20 texts per OpenAI call).
  (async () => {
    try {
      const texts = chunks;
      const embeddings = await embedInBatches(texts);

      const writes = embeddings
        .map((embedding, i) => {
          if (!embedding) return null;
          return {
            updateOne: {
              filter: { bookId: bookDoc._id, chunkIndex: i },
              update: { $set: { embedding } },
            },
          };
        })
        .filter((op): op is NonNullable<typeof op> => op !== null);

      if (writes.length > 0) {
        await Segment.bulkWrite(writes);
      }

      console.log(
        `[catalog] embeddings stored for bookId=${bookDoc._id} (${writes.length}/${texts.length} segments)`
      );
    } catch (e) {
      console.error("[catalog] embedding failed for bookId=" + bookDoc._id + ":", e);
    }
  })();
  // ────────────────────────────────────────────────────────────────────────

  revalidatePath("/");
  return { success: true, bookId: bookDoc._id.toString(), alreadyExists: false };
}
