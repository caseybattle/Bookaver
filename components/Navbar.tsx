"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
          <BookOpen className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          <span>Bookaver</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/upload" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Upload
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
