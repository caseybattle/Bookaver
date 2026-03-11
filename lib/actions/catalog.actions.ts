"use server";

import { put } from "@vercel/blob";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book from "@/lib/db/models/Book";
import Segment from "@/lib/db/models/Segment";
import { getClerkId } from "@/lib/clerk/billing";
import { chunkText } from "@/lib/pdf/parser";
import {
  GutenbergBook,
  getBookTextUrl,
  getBookCoverUrl,
  getBookAuthor,
  stripGutenbergBoilerplate,
} from "@/lib/gutenberg";
import { revalidatePath } from "next/cache";

// Cap at ~150 000 words to stay within Vercel's 60-second function timeout
const MAX_WORDS = 150_000;

export async function addGutenbergBook(book: GutenbergBook) {
  const clerkId = await getClerkId();
  await connectToDatabase();

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

  // Upload text to Vercel Blob
  const author = getBookAuthor(book);
  const safeName = book.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
  const blobPath = `books/gutenberg/${book.id}-${safeName}.txt`;
  const blob = new Blob([cappedText], { type: "text/plain" });

  const { url: blobUrl } = await put(blobPath, blob, {
    access: "public",
    contentType: "text/plain",
    // Deduplicate: if this Gutenberg text already exists in Blob, reuse it
    addRandomSuffix: false,
  });

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

  await Segment.insertMany(
    chunks.map((content, chunkIndex) => ({
      bookId: bookDoc._id,
      clerkId,
      content,
      chunkIndex,
    }))
  );

  // Update totalSegments
  await Book.findByIdAndUpdate(bookDoc._id, {
    totalSegments: chunks.length,
  });

  revalidatePath("/");
  return { success: true, bookId: bookDoc._id.toString(), alreadyExists: false };
}
