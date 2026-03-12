"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/catalog", label: "Catalog" },
  { href: "/", label: "Library" },
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#2e2418]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-stone-900 dark:text-stone-50">
          <svg
            className="w-6 h-6 text-amber-600 dark:text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 7a1 1 0 0 1 1-1h5v11H3a1 1 0 0 1-1-1V7z" />
            <path d="M8 6h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8" />
            <line x1="8" y1="6" x2="8" y2="17" />
            <path d="M15 10a3 3 0 0 1 0 4" />
            <path d="M17.5 8.5a6 6 0 0 1 0 7" />
          </svg>
          <span>Bookauver</span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive(href)
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-3">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Mobile: theme toggle + avatar + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#2e2418] px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive(href)
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
