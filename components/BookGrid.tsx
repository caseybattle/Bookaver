"use client";

import { useRouter } from "next/navigation";
import BookCard from "@/components/BookCard";
import { deleteBook } from "@/lib/actions/book.actions";
import { toast } from "sonner";

interface BookGridProps {
  books: Array<{
    _id: string;
    title: string;
    author: string;
    coverUrl?: string;
    pageCount?: number;
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
      <div className="text-center py-20 text-stone-400 dark:text-stone-500">
        <p className="text-lg">No books yet.</p>
        <p className="text-sm mt-1">Upload a PDF to get started.</p>
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
