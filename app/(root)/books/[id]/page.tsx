import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book, { IBook } from "@/lib/db/models/Book";
import VoiceSession from "@/components/VoiceSession";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) notFound();

  await connectToDatabase();
  const book = await Book.findOne({ _id: id, clerkId: userId }).lean<IBook>();
  if (!book) notFound();

  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      {/* Book info */}
      <div className="flex items-start gap-4">
        {/* Cover image or fallback icon */}
        <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-[#0f0e0d] flex items-center justify-center">
          {(book as IBook & { coverUrl?: string }).coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(book as IBook & { coverUrl?: string }).coverUrl}
              alt={`${book.title as string} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">{book.title as string}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
            {book.author as string} · {book.totalPages as number} pages · {book.totalSegments as number} segments
          </p>
        </div>
      </div>

      {/* Voice session */}
      <VoiceSession
        bookId={id}
        bookTitle={book.title as string}
        assistantId={assistantId}
      />
    </div>
  );
}
