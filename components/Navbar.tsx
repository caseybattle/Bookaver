"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#0f0e0d]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-stone-900 dark:text-stone-50">
          <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <span>Bookavio</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/upload" className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
            Upload
          </Link>
          <Link href="/dashboard" className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
            Dashboard
          </Link>
          <Link href="/pricing" className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors">
            Pricing
          </Link>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
