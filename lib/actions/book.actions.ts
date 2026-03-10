"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book, { IBook } from "@/lib/db/models/Book";
import Segment from "@/lib/db/models/Segment";
import { getClerkId } from "@/lib/clerk/billing";
import { extractAndSegmentPDF } from "@/lib/pdf/parser";

export async function createBook(formData: FormData) {
  const clerkId = await getClerkId();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  if (!file || !title || !author) {
    throw new Error("Missing required fields");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported");
  }

  await connectToDatabase();

  // Upload PDF to Vercel Blob
  const blobPath = `books/${clerkId}/${Date.now()}-${file.name}`;
  const buffer = await file.arrayBuffer();

  const { url: blobUrl } = await put(blobPath, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  // Create book record
  const book = await Book.create({
    clerkId,
    title,
    author,
    blobUrl,
    totalPages: 0,
    totalSegments: 0,
  });

  // Extract and store segments
  const segments = await extractAndSegmentPDF(buffer);

  await Segment.insertMany(
    segments.map((seg) => ({
      bookId: book._id,
      clerkId,
      content: seg.content,
      chunkIndex: seg.chunkIndex,
      pageNumber: seg.pageNumber,
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
