"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, X, Library, BookOpen } from "lucide-react";
import CatalogCard from "@/components/CatalogCard";
import GoogleBooksCard from "@/components/GoogleBooksCard";
import { GutenbergBook, GutendexResponse } from "@/lib/gutenberg";
import { GoogleBook } from "@/lib/google-books";

type Source = "gutenberg" | "google";

interface CatalogSearchProps {
  initialData: GutendexResponse;
}

export default function CatalogSearch({ initialData }: CatalogSearchProps) {
  // ── Source tab ──────────────────────────────────────────────────────
  const [source, setSource] = useState<Source>("gutenberg");

  // ── Gutenberg state ─────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [data, setData] = useState<GutendexResponse>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Google Books state ──────────────────────────────────────────────
  const [gbQuery, setGbQuery] = useState("");
  const [gbItems, setGbItems] = useState<GoogleBook[]>([]);
  const [gbTotal, setGbTotal] = useState(0);
  const [gbPage, setGbPage] = useState(1);
  const [gbLoading, setGbLoading] = useState(false);
  const gbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Gutenberg search ────────────────────────────────────────────────
  const search = useCallback(async (q: string, pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`https://gutendex.com/books?${params}`);
      const json: GutendexResponse = await res.json();
      setData(json);
      setPage(pg);
    } catch {
      // keep previous results on error
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val, 1), 400);
  };

  const clearSearch = () => {
    setQuery("");
    search("", 1);
  };

  const handlePrev = () => { if (page > 1) search(query, page - 1); };
  const handleNext = () => { if (data.next) search(query, page + 1); };

  const booksWithText = data.results.filter((b: GutenbergBook) => {
    const f = b.formats;
    return (
      f["text/plain; charset=utf-8"] ||
      f["text/plain; charset=us-ascii"] ||
      f["text/plain"]
    );
  });

  // ── Google Books search ─────────────────────────────────────────────
  const searchGoogle = useCallback(async (q: string, pg = 1) => {
    if (!q.trim()) {
      setGbItems([]);
      setGbTotal(0);
      return;
    }
    setGbLoading(true);
    try {
      const startIndex = (pg - 1) * 20;
      const params = new URLSearchParams({
        q: q.trim(),
        startIndex: String(startIndex),
        maxResults: "20",
        printType: "books",
        langRestrict: "en",
      });
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
      const json = await res.json();
      setGbItems(json.items ?? []);
      setGbTotal(json.totalItems ?? 0);
      setGbPage(pg);
    } catch {
      // keep previous results
    } finally {
      setGbLoading(false);
    }
  }, []);

  const handleGbQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGbQuery(val);
    if (gbDebounceRef.current) clearTimeout(gbDebounceRef.current);
    gbDebounceRef.current = setTimeout(() => searchGoogle(val, 1), 400);
  };

  const clearGbSearch = () => {
    setGbQuery("");
    setGbItems([]);
    setGbTotal(0);
    setGbPage(1);
  };

  const gbHasNext = gbTotal > gbPage * 20;

  return (
    <div className="space-y-6">
      {/* Source tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
        <button
          onClick={() => setSource("gutenberg")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            source === "gutenberg"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          }`}
        >
          <Library className="w-3.5 h-3.5" />
          Free Books
        </button>
        <button
          onClick={() => setSource("google")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            source === "google"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Discover More
        </button>
      </div>

      {/* ── Gutenberg tab ──────────────────────────────────────────── */}
      {source === "gutenberg" && (
        <div className="space-y-6">
          {/* Search input */}
          <div className="relative flex items-center max-w-xl">
            <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search 70,000+ public domain books…"
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm shadow-sm"
            />
            {loading && (
              <Loader2 className="absolute right-3.5 w-4 h-4 text-stone-400 animate-spin" />
            )}
            {!loading && query && (
              <button
                onClick={clearSearch}
                className="absolute right-3.5 w-4 h-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results meta */}
          {data.count > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {query.trim()
                ? `${data.count.toLocaleString()} results for "${query}"`
                : `${data.count.toLocaleString()} books available`}
              {booksWithText.length < data.results.length && (
                <span className="ml-2 text-stone-400 dark:text-stone-600">
                  (showing {booksWithText.length} with readable text)
                </span>
              )}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse aspect-[2/3]"
                />
              ))}
            </div>
          ) : booksWithText.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {booksWithText.map((book: GutenbergBook) => (
                <CatalogCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-stone-400 dark:text-stone-500">
              <p className="text-lg">No results found.</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          )}

          {/* Pagination */}
          {(data.previous || data.next) && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handlePrev}
                disabled={!data.previous || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                Page {page}
              </span>
              <button
                onClick={handleNext}
                disabled={!data.next || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Google Books tab ────────────────────────────────────────── */}
      {source === "google" && (
        <div className="space-y-6">
          {/* How it works banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-amber-200/60 dark:border-amber-800/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                How the catalog works
              </p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-amber-200/60 dark:divide-amber-800/40">
              <div className="flex items-start gap-3 p-4">
                <span className="text-lg leading-none mt-0.5">🔖</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-0.5">
                    Free Books (Project Gutenberg)
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Click any card — the book is instantly added to your library. No upload needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="text-lg leading-none mt-0.5">📚</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-0.5">
                    Discover More (Google Books)
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Browse millions of titles. Click any card to go to the upload page with title,
                    author, and cover pre-filled — just add your PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search input */}
          <div className="relative flex items-center max-w-xl">
            <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={gbQuery}
              onChange={handleGbQueryChange}
              placeholder="Search by title, author, or ISBN…"
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm shadow-sm"
            />
            {gbLoading && (
              <Loader2 className="absolute right-3.5 w-4 h-4 text-stone-400 animate-spin" />
            )}
            {!gbLoading && gbQuery && (
              <button
                onClick={clearGbSearch}
                className="absolute right-3.5 w-4 h-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results meta */}
          {gbQuery.trim() && gbTotal > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {gbTotal.toLocaleString()} results for &ldquo;{gbQuery}&rdquo;
            </p>
          )}

          {/* Grid */}
          {gbLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse aspect-[2/3]"
                />
              ))}
            </div>
          ) : gbItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {gbItems.map((book) => (
                <GoogleBooksCard key={book.id} book={book} />
              ))}
            </div>
          ) : gbQuery.trim() ? (
            <div className="text-center py-20 text-stone-400 dark:text-stone-500">
              <p className="text-lg">No results found.</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          ) : (
            <div className="text-center py-20 text-stone-400 dark:text-stone-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Search for any book</p>
              <p className="text-sm mt-1">Millions of titles from Google Books</p>
            </div>
          )}

          {/* Pagination */}
          {gbItems.length > 0 && (gbPage > 1 || gbHasNext) && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => searchGoogle(gbQuery, gbPage - 1)}
                disabled={gbPage <= 1 || gbLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                Page {gbPage}
              </span>
              <button
                onClick={() => searchGoogle(gbQuery, gbPage + 1)}
                disabled={!gbHasNext || gbLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
