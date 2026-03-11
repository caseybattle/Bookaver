"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Check, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { addGutenbergBook } from "@/lib/actions/catalog.actions";
import { GutenbergBook, getBookAuthor, getBookCoverUrl, getBookTextUrl } from "@/lib/gutenberg";

interface CatalogCardProps {
  book: GutenbergBook;
}

export default function CatalogCard({ book }: CatalogCardProps) {
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const router = useRouter();

  const coverUrl = getBookCoverUrl(book);
  const author = getBookAuthor(book);
  const hasText = !!getBookTextUrl(book);

  const handleAdd = async () => {
    if (!hasText) {
      toast.error("No plain-text version available for this book.");
      return;
    }
    setStatus("adding");
    try {
      const result = await addGutenbergBook(book);
      if (result.alreadyExists) {
        toast.success("Already in your library! Taking you there…");
      } else {
        toast.success(`"${book.title}" added to your library!`);
      }
      router.push(`/books/${result.bookId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add book");
      setStatus("idle");
    }
  };

  return (
    <div className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-400/60 dark:hover:border-amber-600/60 hover:shadow-md transition-all duration-200">
      {/* Cover */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 overflow-hidden flex items-center justify-center">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-stone-300 dark:text-stone-700">
            <BookOpen className="w-14 h-14" />
            <span className="text-xs font-medium uppercase tracking-widest">No Cover</span>
          </div>
        )}

        {/* Download count badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
          <Download className="w-2.5 h-2.5" />
          {book.download_count.toLocaleString()}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
          <button
            onClick={handleAdd}
            disabled={status !== "idle" || !hasText}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {status === "adding" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing…
              </>
            ) : status === "added" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added!
              </>
            ) : !hasText ? (
              "No text available"
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add to Library
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm leading-snug line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{author}</p>
      </div>
    </div>
  );
}
