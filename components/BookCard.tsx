import Link from "next/link";
import { BookOpen, Trash2 } from "lucide-react";
import { IBook } from "@/lib/db/models/Book";

interface BookCardProps {
  book: IBook & { _id: string };
  onDelete?: (id: string) => void;
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{book.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(book._id)}
            className="text-gray-400 dark:text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
            aria-label="Delete book"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span>{book.totalPages} pages</span>
        <span>{book.totalSegments} segments</span>
      </div>
      <Link
        href={`/books/${book._id}`}
        className="mt-auto w-full text-center text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 transition-colors"
      >
        Start Conversation
      </Link>
    </div>
  );
}
