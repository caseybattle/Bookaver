"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import CatalogCard from "@/components/CatalogCard";
import { GutenbergBook, GutendexResponse } from "@/lib/gutenberg";

interface CatalogSearchProps {
  initialData: GutendexResponse;
}

export default function CatalogSearch({ initialData }: CatalogSearchProps) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<GutendexResponse>(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mime_type: "text/plain",
        page: String(pg),
      });
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

  const handlePrev = () => {
    if (page > 1) search(query, page - 1);
  };

  const handleNext = () => {
    if (data.next) search(query, page + 1);
  };

  const booksWithText = data.results.filter((b: GutenbergBook) => {
    const f = b.formats;
    return (
      f["text/plain; charset=utf-8"] ||
      f["text/plain; charset=us-ascii"] ||
      f["text/plain"]
    );
  });

  return (
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
  );
}
