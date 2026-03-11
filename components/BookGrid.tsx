"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Library, Upload } from "lucide-react";
import BookCard from "@/components/BookCard";
import { deleteBook } from "@/lib/actions/book.actions";
import { toast } from "sonner";

interface BookGridProps {
  books: Array<{
    _id: string;
    title: string;
    author: string;
    coverUrl?: string;
    totalPages?: number;
    totalSegments?: number;
    createdAt?: string;
  }>;
}

export default function BookGrid({ books }: BookGridProps) {
  const router = useRouter();

  const handleDelete = async (bookId: string) => {
    try {
      await deleteBook(bookId);
      toast.success("Book deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-20">
        <Library className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
        <p className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-1">
          Your library is empty
        </p>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
          Browse 70,000+ free classics or upload your own PDF.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Library className="w-4 h-4" />
            Browse Catalog
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload a PDF
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <BookCard
          key={book._id}
          book={book as any}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
