"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (e.target.value) {
        params.set("q", e.target.value);
      } else {
        params.delete("q");
      }
      router.replace(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
      <input
        type="text"
        placeholder="Search your books..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleSearch}
        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  );
}
