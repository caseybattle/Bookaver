"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Library" },
  { href: "/catalog", label: "Catalog" },
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#0f0e0d]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-stone-900 dark:text-stone-50">
          <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <span>Bookaver</span>
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="ml-2 flex items-center gap-3">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}
