"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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

  return (
    <nav className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#0f0e0d]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-stone-900 dark:text-stone-50">
          {/* Book + sound-waves icon */}
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
            {/* Left page */}
            <path d="M2 7a1 1 0 0 1 1-1h5v11H3a1 1 0 0 1-1-1V7z" />
            {/* Right page */}
            <path d="M8 6h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8" />
            {/* Spine */}
            <line x1="8" y1="6" x2="8" y2="17" />
            {/* Sound wave — inner */}
            <path d="M15 10a3 3 0 0 1 0 4" />
            {/* Sound wave — outer */}
            <path d="M17.5 8.5a6 6 0 0 1 0 7" />
          </svg>
          <span>Bookauver</span>
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
