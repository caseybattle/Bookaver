"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import CatalogCard from "@/components/CatalogCard";
import IACatalogCard from "@/components/IACatalogCard";
import { GutenbergBook, GutendexResponse } from "@/lib/gutenberg";
import { IABook, IASearchResponse } from "@/lib/internet-archive";

interface CatalogSearchProps {
  initialData?: GutendexResponse | null;
}

// Discriminated union for unified display
type UnifiedBook =
  | { source: "gutenberg"; book: GutenbergBook }
  | { source: "ia"; book: IABook };

function hasGutenbergText(book: GutenbergBook): boolean {
  const f = book.formats;
  return !!(
    f["text/plain; charset=utf-8"] ||
    f["text/plain; charset=us-ascii"] ||
    f["text/plain"]
  );
}

function hasIADownload(book: IABook): boolean {
  return !!(book.ia && book.ia.length > 0);
}

function mergeResults(gutenbergBooks: GutenbergBook[], iaBooks: IABook[]): UnifiedBook[] {
  const merged: UnifiedBook[] = [];
  const maxLen = Math.max(gutenbergBooks.length, iaBooks.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < gutenbergBooks.length) merged.push({ source: "gutenberg", book: gutenbergBooks[i] });
    if (i < iaBooks.length) merged.push({ source: "ia", book: iaBooks[i] });
  }
  return merged;
}

export default function CatalogSearch({ initialData }: CatalogSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // For default (no search) state — Gutenberg popular books with pagination
  const [defaultData, setDefaultData] = useState<GutendexResponse | null>(initialData ?? null);
  const [defaultPage, setDefaultPage] = useState(1);
  const [defaultLoading, setDefaultLoading] = useState(!initialData);

  // For search results — unified merged list
  const [searchResults, setSearchResults] = useState<UnifiedBook[] | null>(null);
  const [searchTotal, setSearchTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client-side initial load — runs immediately on mount so the page shell renders first
  useEffect(() => {
    if (!initialData) {
      loadDefaultPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      setSearchTotal(0);
      return;
    }
    setLoading(true);
    try {
      const [gutRes, iaRes] = await Promise.allSettled([
        fetch(`https://gutendex.com/books?search=${encodeURIComponent(q.trim())}`).then(
          (r) => r.json() as Promise<GutendexResponse>
        ),
        fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q.trim())}&ebook_access=public&fields=key,title,author_name,ia,first_publish_year,cover_i&limit=20&language=eng`,
          { headers: { "User-Agent": "Bookaver/1.0 (https://bookaver.vercel.app)" } }
        ).then((r) => r.json() as Promise<IASearchResponse>),
      ]);

      const gutenbergBooks =
        gutRes.status === "fulfilled"
          ? (gutRes.value.results ?? []).filter(hasGutenbergText)
          : [];
      const iaBooks =
        iaRes.status === "fulfilled"
          ? (iaRes.value.docs ?? []).filter(hasIADownload)
          : [];

      const merged = mergeResults(gutenbergBooks, iaBooks);
      setSearchResults(merged);
      setSearchTotal(
        (gutRes.status === "fulfilled" ? (gutRes.value.count ?? 0) : 0) +
          (iaRes.status === "fulfilled" ? (iaRes.value.numFound ?? 0) : 0)
      );
    } catch {
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 400);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
    setSearchTotal(0);
  };

  // Default pagination (no search query)
  const loadDefaultPage = useCallback(async (pg: number) => {
    setDefaultLoading(true);
    try {
      const res = await fetch(`https://gutendex.com/books?page=${pg}`);
      const json: GutendexResponse = await res.json();
      setDefaultData(json);
      setDefaultPage(pg);
    } catch {
      // keep previous
    } finally {
      setDefaultLoading(false);
    }
  }, []);

  const isSearching = !!query.trim();
  const showLoading = loading || (!isSearching && defaultLoading);

  // Build display list for default view
  const defaultBooks = (defaultData?.results ?? []).filter(hasGutenbergText);

  return (
    <div className="space-y-6">
      {/* Single unified search input */}
      <div className="relative flex items-center max-w-xl">
        <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search 2 million+ books\u2026"
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#241c16] border border-stone-200 dark:border-[#52402c] rounded-xl text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm shadow-sm"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-stone-400 animate-spin" />
        ) : query ? (
          <button
            onClick={clearSearch}
            className="absolute right-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Results count */}
      {isSearching && !loading && searchResults !== null && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {searchTotal > 0
            ? `${searchTotal.toLocaleString()} books found for \u201c${query}\u201d`
            : `No results for \u201c${query}\u201d`}
        </p>
      )}
      {!isSearching && (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {(defaultData?.count ?? 0) > 0 ? `${defaultData!.count.toLocaleString()} books available` : ""}
        </p>
      )}

      {/* Grid */}
      {showLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-stone-100 dark:bg-[#3c2e20] animate-pulse aspect-[2/3]"
            />
          ))}
        </div>
      ) : isSearching && searchResults !== null ? (
        searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {searchResults.map((item, idx) =>
              item.source === "gutenberg" ? (
                <CatalogCard key={`g-${item.book.id}`} book={item.book} />
              ) : (
                <IACatalogCard key={`ia-${item.book.key}-${idx}`} book={item.book} />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-stone-400 dark:text-stone-500">
            <p className="text-lg">No results found.</p>
            <p className="text-sm mt-1">Try a different title or author.</p>
          </div>
        )
      ) : defaultBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {defaultBooks.map((book) => (
            <CatalogCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-stone-400 dark:text-stone-500">
          <p className="text-lg">No books found.</p>
        </div>
      )}

      {/* Pagination — only shown in default (no-query) view */}
      {!isSearching && (defaultData?.previous || defaultData?.next) && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => loadDefaultPage(defaultPage - 1)}
            disabled={!defaultData?.previous || defaultLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-[#3c2e20] dark:hover:bg-[#52402c] text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-stone-500 dark:text-stone-400">Page {defaultPage}</span>
          <button
            onClick={() => loadDefaultPage(defaultPage + 1)}
            disabled={!defaultData?.next || defaultLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 hover:bg-stone-200 dark:bg-[#3c2e20] dark:hover:bg-[#52402c] text-stone-700 dark:text-stone-300 disabled:opacity-40 rounded-xl transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
