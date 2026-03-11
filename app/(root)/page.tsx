import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBooks } from "@/lib/actions/book.actions";
import BookGrid from "@/components/BookGrid";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { Plus, Upload, Cpu, Mic, Library } from "lucide-react";

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
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#f5ede0" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-0">

            {/* Left — headline + CTA */}
            <div className="px-8 py-10 flex flex-col justify-center gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                  Your Library
                </h1>
                <p className="mt-3 text-stone-600 text-base max-w-sm leading-relaxed">
                  Convert your books into{" "}
                  <span className="font-semibold text-amber-700">interactive AI conversations.</span>{" "}
                  Listen, learn, and discuss your favorite reads.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 rounded-xl text-sm font-semibold transition-colors shadow-sm border border-stone-200"
                >
                  <Plus className="w-4 h-4" />
                  Add new book
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Library className="w-4 h-4" />
                  Browse Catalog
                </Link>
              </div>
            </div>

            {/* Center — illustrated scene */}
            <div className="hidden lg:flex items-end justify-center px-6 pt-6" style={{ minWidth: "220px" }}>
              <div className="relative select-none" style={{ fontSize: "1px" }}>
                {/* Desk lamp */}
                <div className="absolute" style={{ right: "10px", top: "0px", fontSize: "52px", lineHeight: 1 }}>
                  🪔
                </div>
                {/* Globe */}
                <div className="absolute" style={{ left: "-20px", top: "30px", fontSize: "48px", lineHeight: 1 }}>
                  🌍
                </div>
                {/* Stack of books */}
                <div style={{ fontSize: "72px", lineHeight: 1, marginTop: "60px", display: "flex", gap: "4px", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "56px" }}>📚</span>
                  <span style={{ fontSize: "64px" }}>📖</span>
                  <span style={{ fontSize: "56px" }}>📕</span>
                </div>
              </div>
            </div>

            {/* Right — numbered steps card */}
            <div className="flex items-center justify-center lg:justify-end px-6 lg:px-8 py-8">
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 w-full max-w-xs lg:max-w-[220px]">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">How it works</p>
                <div className="flex flex-col gap-4">
                  {[
                    { step: "1", icon: Upload, label: "Upload PDF", desc: "Add your book file" },
                    { step: "2", icon: Cpu,    label: "AI Processing", desc: "We analyze the content" },
                    { step: "3", icon: Mic,    label: "Voice Chat",   desc: "Discuss with AI" },
                  ].map(({ step, icon: Icon, label, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-800 leading-tight flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {label}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
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
