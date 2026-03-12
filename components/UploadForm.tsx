"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Upload, FileText, Loader2, Search, X, BookOpen, Check } from "lucide-react";
import { createBook } from "@/lib/actions/book.actions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { sanitizeMarcTitle } from "@/lib/utils";

interface OLResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export default function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const coverUrlRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Open Library search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OLResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-filled state: true when arriving from Google Books catalog
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [preFilledTitle, setPreFilledTitle] = useState("");

  // Pre-fill from URL params (e.g. coming from Google Books catalog)
  useEffect(() => {
    const title = searchParams.get("title") ?? "";
    const author = searchParams.get("author") ?? "";
    const cover = searchParams.get("cover") ?? "";
    if (!title) return;
    if (titleRef.current) titleRef.current.value = title;
    if (authorRef.current) authorRef.current.value = author;
    if (cover) setSelectedCoverUrl(cover);
    setSearchQuery(`${title}${author ? ` — ${author}` : ""}`);
    setIsPreFilled(true);
    setPreFilledTitle(title);
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Open Library search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=key,title,author_name,cover_i`
      );
      const data = await res.json();
      setSearchResults(data.docs ?? []);
      setShowDropdown(true);
    } catch {
      // silently fail — catalog is optional
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  };

  const handleSelectResult = (result: OLResult) => {
    const title = sanitizeMarcTitle(result.title ?? "");
    const author = result.author_name?.[0] ?? "";
    const coverUrl = result.cover_i
      ? `https://covers.openlibrary.org/b/id/${result.cover_i}-L.jpg`
      : "";

    if (titleRef.current) titleRef.current.value = title;
    if (authorRef.current) authorRef.current.value = author;
    if (coverUrlRef.current) coverUrlRef.current.value = coverUrl;
    setSelectedCoverUrl(coverUrl);
    setSearchQuery(`${title}${author ? ` — ${author}` : ""}`);
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedCoverUrl("");
    if (titleRef.current) titleRef.current.value = "";
    if (authorRef.current) authorRef.current.value = "";
    if (coverUrlRef.current) coverUrlRef.current.value = "";
  };

  // Switch from pre-filled mode back to manual search
  const handleSearchDifferent = () => {
    setIsPreFilled(false);
    clearSearch();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
    else toast.error("Please upload a PDF file");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(e.currentTarget);
      await createBook(fd);
      toast.success("Book uploaded and processed!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Open Library catalog search — collapses when pre-filled from catalog */}
      <div>
        {isPreFilled ? (
          /* Collapsed "book already selected" state */
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Book catalog
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-stone-800 dark:text-stone-200 truncate font-medium">
                {preFilledTitle} — pre-filled from catalog
              </span>
            </div>
            <button
              type="button"
              onClick={handleSearchDifferent}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors underline underline-offset-2"
            >
              Search a different book →
            </button>
          </div>
        ) : (
          /* Normal search state */
          <>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Search book catalog{" "}
              <span className="text-stone-400 dark:text-stone-500 font-normal">(optional — auto-fills title & author)</span>
            </label>
            <div className="relative" ref={searchRef}>
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Search by title or author…"
                  autoComplete="off"
                  className="w-full pl-9 pr-9 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                />
                {searching ? (
                  <Loader2 className="absolute right-3 w-4 h-4 text-stone-400 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 w-4 h-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
                  {searchResults.map((result) => {
                    const coverThumb = result.cover_i
                      ? `https://covers.openlibrary.org/b/id/${result.cover_i}-S.jpg`
                      : null;
                    return (
                      <button
                        key={result.key}
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors text-left border-b border-stone-100 dark:border-stone-800 last:border-0"
                      >
                        <div className="w-8 h-11 rounded bg-stone-100 dark:bg-stone-800 shrink-0 overflow-hidden flex items-center justify-center">
                          {coverThumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverThumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">
                            {sanitizeMarcTitle(result.title)}
                          </p>
                          {result.author_name?.[0] && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                              {result.author_name[0]}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {showDropdown && searchResults.length === 0 && !searching && searchQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg px-4 py-3 text-sm text-stone-500 dark:text-stone-400">
                  No results found — fill in the fields manually below.
                </div>
              )}
            </div>

            {/* Selected cover preview */}
            {selectedCoverUrl && (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedCoverUrl.replace("-L.jpg", "-M.jpg")}
                  alt="Selected cover"
                  className="h-16 w-11 object-cover rounded border border-stone-200 dark:border-stone-700"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Cover image selected
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drop zone — primary focus when pre-filled */}
      {isPreFilled && (
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300 -mb-2">
          Now upload your PDF copy:
        </p>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-amber-500 bg-amber-500/5" : "border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-amber-500" />
            <p className="text-stone-900 dark:text-stone-50 font-medium">{file.name}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-stone-400 dark:text-stone-500" />
            <p className="text-stone-700 dark:text-stone-300 font-medium">Drop your PDF here or click to browse</p>
            <p className="text-sm text-stone-400 dark:text-stone-500">Up to 100 MB</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-stone-500 dark:text-stone-400 mb-1.5">Title</label>
          <input
            ref={titleRef}
            name="title"
            required
            placeholder="Book title"
            className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-stone-500 dark:text-stone-400 mb-1.5">Author</label>
          <input
            ref={authorRef}
            name="author"
            required
            placeholder="Author name"
            className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Hidden coverUrl field passed to server action */}
      <input ref={coverUrlRef} type="hidden" name="coverUrl" value={selectedCoverUrl} />

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          "Upload & Process Book"
        )}
      </button>
    </form>
  );
}
