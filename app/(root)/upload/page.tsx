import { Suspense } from "react";
import UploadForm from "@/components/UploadForm";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; author?: string; cover?: string }>;
}) {
  const { title, author, cover } = await searchParams;
  const hasBook = !!title;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          {hasBook ? `Add your copy of "${title}"` : "Upload a Book"}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
          {hasBook
            ? "You selected this book from the catalog. Upload your PDF copy — we'll index it so you can start a voice conversation."
            : "Upload a PDF — we'll parse and index it for voice conversations."}
        </p>
      </div>

      {/* Selected-book context banner */}
      {hasBook && (
        <div className="flex items-center gap-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-r-xl px-4 py-3">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={title}
              className="w-[60px] h-[88px] object-cover rounded shadow-sm shrink-0"
            />
          ) : (
            <div className="w-[60px] h-[88px] bg-amber-100 dark:bg-amber-900/40 rounded flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-amber-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
              Selected from catalog
            </p>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
              {title}
            </p>
            {author && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {author}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
        <Suspense fallback={<div className="animate-pulse h-96 bg-stone-100 dark:bg-stone-800 rounded-xl" />}>
          <UploadForm />
        </Suspense>
      </div>
    </div>
  );
}
