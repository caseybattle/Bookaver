import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBooks } from "@/lib/actions/book.actions";
import BookGrid from "@/components/BookGrid";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { Plus } from "lucide-react";

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { q } = await searchParams;
  const books = await getBooks(q);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Library</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Talk to your books using AI</p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </Link>
      </div>

      {/* Search */}
      <Suspense>
        <SearchBar />
      </Suspense>

      {/* Book grid */}
      <BookGrid books={books.map((b) => ({ ...b, _id: b._id.toString() }))} />
    </div>
  );
}
