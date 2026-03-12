"use client";

import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { IBook } from "@/lib/db/models/Book";
import { sanitizeMarcTitle } from "@/lib/utils";

interface BookCardProps {
  book: IBook & { _id: string };
  onDelete?: (id: string) => void;
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  return (
    <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-400/60 dark:hover:border-amber-600/60 transition-colors shadow-sm">
      {/* Cover image area */}
      <div className="relative w-full h-48 bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-[#0f0e0d] flex items-center justify-center overflow-hidden">
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={`${sanitizeMarcTitle(book.title)} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-stone-300 dark:text-stone-700">
            <BookOpen className="w-12 h-12" />
            <span className="text-xs font-medium uppercase tracking-widest opacity-60">No Cover</span>
          </div>
        )}
        {/* Delete button overlay */}
        {onDelete && (
          <button
            onClick={() => onDelete(book._id)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500/80 text-stone-200 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Delete book"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-50 leading-snug line-clamp-2">{sanitizeMarcTitle(book.title)}</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 truncate">{sanitizeMarcTitle(book.author)}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <span>{book.totalPages} pages</span>
          <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
          <span>{book.totalSegments} segments</span>
        </div>
        <Link
          href={`/books/${book._id}`}
          className="mt-auto w-full text-center text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2 font-medium transition-colors"
        >
          Start Conversation
        </Link>
      </div>
    </div>
  );
}
