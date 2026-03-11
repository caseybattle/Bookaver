import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPopularGutenbergBooks } from "@/lib/gutenberg";
import CatalogSearch from "@/components/CatalogSearch";
import { Library } from "lucide-react";

export const metadata = {
  title: "Book Catalog — Bookaver",
  description: "Browse 70,000+ free public domain books from Project Gutenberg.",
};

export default async function CatalogPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Server-side fetch for instant first paint; CatalogSearch handles client-side searches
  const initialData = await getPopularGutenbergBooks(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 px-8 py-10">
        <div className="flex items-center gap-2 mb-3">
          <Library className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm uppercase tracking-wide">
            Public Domain Catalog
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 leading-tight mb-2">
          70,000+ Free Books
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl">
          Browse the complete Project Gutenberg library. Click any book to add it to
          your library instantly — no PDF upload needed.
        </p>
      </div>

      {/* Search input + results grid + pagination */}
      <CatalogSearch initialData={initialData} />
    </div>
  );
}
