"use client";

import Link from "next/link";
import { BookOpen, Upload } from "lucide-react";
import { GoogleBook, getGoogleBookAuthor, getGoogleBookCover } from "@/lib/google-books";

interface GoogleBooksCardProps {
  book: GoogleBook;
}

export default function GoogleBooksCard({ book }: GoogleBooksCardProps) {
  const { volumeInfo } = book;
  const coverUrl = getGoogleBookCover(book);
  const author = getGoogleBookAuthor(book);
  const year = volumeInfo.publishedDate?.slice(0, 4);

  // Build upload URL pre-filled with this book's metadata
  const uploadParams = new URLSearchParams();
  uploadParams.set("title", volumeInfo.title);
  if (author && author !== "Unknown Author") uploadParams.set("author", author);
  if (coverUrl) uploadParams.set("cover", coverUrl);

  return (
    <div className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-400/60 dark:hover:border-amber-600/60 hover:shadow-md transition-all duration-200">
      {/* Cover */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 overflow-hidden flex items-center justify-center">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`${volumeInfo.title} cover`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-stone-300 dark:text-stone-700">
            <BookOpen className="w-14 h-14" />
            <span className="text-xs font-medium uppercase tracking-widest">No Cover</span>
          </div>
        )}

        {/* Year badge */}
        {year && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
            {year}
          </div>
        )}

        {/* Hover overlay — link to upload with pre-filled metadata */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
          <Link
            href={`/upload?${uploadParams.toString()}`}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50 text-sm leading-snug line-clamp-2">
          {volumeInfo.title}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{author}</p>
      </div>
    </div>
  );
}
