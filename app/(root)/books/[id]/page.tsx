import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book from "@/lib/db/models/Book";
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
  const book = await Book.findOne({ _id: id, clerkId: userId }).lean();
  if (!book) notFound();

  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      {/* Book info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{book.title as string}</h1>
          <p className="text-gray-400 text-sm">{book.author as string} · {book.totalPages as number} pages · {book.totalSegments as number} segments</p>
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
