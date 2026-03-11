"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book, { IBook } from "@/lib/db/models/Book";
import Segment from "@/lib/db/models/Segment";
import { getClerkId } from "@/lib/clerk/billing";
import { extractAndSegmentPDF } from "@/lib/pdf/parser";
import { embedInBatches } from "@/lib/embeddings";

async function fetchBookCover(title: string, author: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } catch {
    return null;
  }
}

export async function createBook(formData: FormData) {
  const clerkId = await getClerkId();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const prefilledCoverUrl = (formData.get("coverUrl") as string | null) || "";

  if (!file || !title || !author) {
    throw new Error("Missing required fields");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported");
  }

  await connectToDatabase();

  // Use pre-filled cover from catalog search; fall back to OpenLibrary fetch
  const coverUrl = prefilledCoverUrl || await fetchBookCover(title, author);

  // Upload PDF to Vercel Blob
  const blobPath = `books/${clerkId}/${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();

  const { url: blobUrl } = await put(blobPath, buffer, {
    access: "private",
    contentType: "application/pdf",
  });

  // Create book record
  const book = await Book.create({
    clerkId,
    title,
    author,
    blobUrl,
    ...(coverUrl ? { coverUrl } : {}),
    totalPages: 0,
    totalSegments: 0,
  });

  // Extract and segment PDF text
  const segments = await extractAndSegmentPDF(buffer);

  // Generate semantic embeddings for all segments (batched, 20 at a time).
  // If embedding fails (no API key, quota, etc.), we still save segments
  // and fall back to keyword search at query time.
  let embeddings: Array<number[] | null> = new Array(segments.length).fill(null);
  try {
    console.log(`[createBook] generating embeddings for ${segments.length} segments...`);
    embeddings = await embedInBatches(
      segments.map((s) => s.content),
      20
    );
    console.log(`[createBook] embeddings generated successfully`);
  } catch (embErr) {
    console.warn("[createBook] embedding generation failed — storing segments without embeddings:", embErr);
  }

  // Store segments (with embeddings where available)
  await Segment.insertMany(
    segments.map((seg, i) => ({
      bookId: book._id,
      clerkId,
      content: seg.content,
      chunkIndex: seg.chunkIndex,
      pageNumber: seg.pageNumber,
      ...(embeddings[i] ? { embedding: embeddings[i] } : {}),
    }))
  );

  // Update book with segment count
  await Book.findByIdAndUpdate(book._id, {
    totalSegments: segments.length,
  });

  revalidatePath("/");
  return { success: true, bookId: book._id.toString() };
}

export async function getBooks(searchQuery?: string) {
  const clerkId = await getClerkId();
  await connectToDatabase();

  const query: Record<string, unknown> = { clerkId };

  if (searchQuery?.trim()) {
    query.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { author: { $regex: searchQuery, $options: "i" } },
    ];
  }

  const books = await Book.find(query)
    .sort({ createdAt: -1 })
    .lean<IBook[]>()
    .exec();

  return books.map((book) => ({
    ...book,
    _id: book._id.toString(),
  }));
}

export async function deleteBook(bookId: string) {
  const clerkId = await getClerkId();
  await connectToDatabase();

  const book = await Book.findOne({ _id: bookId, clerkId });
  if (!book) throw new Error("Book not found");

  // Delete blob
  try {
    await del(book.blobUrl);
  } catch {
    // Blob may already be deleted — continue
  }

  // Delete segments
  await Segment.deleteMany({ bookId: book._id });

  // Delete book
  await Book.findByIdAndDelete(bookId);

  revalidatePath("/");
  return { success: true };
}
