import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBooks } from "@/lib/actions/book.actions";
import BookGrid from "@/components/BookGrid";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { Plus, Upload, Cpu, Mic } from "lucide-react";

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { q } = await searchParams;
  const books = await getBooks(q);

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      {!q && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 px-8 py-10">
          <div className="max-w-2xl mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
              Convert your books into{" "}
              <span className="text-amber-600 dark:text-amber-400">
                interactive AI conversations.
              </span>
            </h1>
            <p className="mt-3 text-stone-500 dark:text-stone-400 text-lg">
              Listen, learn, and discuss your favorite reads.
            </p>
          </div>

          {/* 3-step cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Add your book file",
                desc: "Upload any PDF — textbooks, novels, non-fiction.",
              },
              {
                step: "2",
                icon: Cpu,
                title: "AI Processing",
                desc: "We extract, segment, and index the full text automatically.",
              },
              {
                step: "3",
                icon: Mic,
                title: "Voice Chat",
                desc: "Start a real-time AI voice conversation with your book.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-amber-200/60 dark:border-stone-800 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step}
                  </span>
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm mb-1">
                  {title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add new book
          </Link>
        </div>
      )}

      {/* Library header (shown when searching, or as section title when not) */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className={`font-bold text-stone-900 dark:text-stone-50 ${q ? "text-2xl" : "text-xl"}`}>
            {q ? `Results for "${q}"` : "My Library"}
          </h2>
          {!q && (
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              {books.length} {books.length === 1 ? "book" : "books"} in your collection
            </p>
          )}
        </div>
        {q ? (
          <Link
            href="/"
            className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
          >
            ← Clear search
          </Link>
        ) : (
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </Link>
        )}
      </div>

      {/* Search */}
      <Suspense>
        <SearchBar />
      </Suspense>

      {/* Book grid */}
      <BookGrid
        books={books.map((b) => ({
          _id: b._id.toString(),
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
          totalPages: b.totalPages,
          totalSegments: b.totalSegments,
          createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : undefined,
        }))}
      />
    </div>
  );
}
