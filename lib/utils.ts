import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Strip MARC/AACR2 subfield codes returned by the OpenLibrary API.
// e.g. "Religion and the rise of capitalism : $b A historical study" → "Religion and the rise of capitalism: A historical study"
export function sanitizeMarcTitle(raw: string): string {
  return raw
    .replace(/\s*:\s*\$[a-zA-Z]\s*/g, ": ")  // ": $b " → ": "
    .replace(/\s*\/\s*\$[a-zA-Z]\s*/g, " ")   // "/ $c " → " "
    .replace(/\s*\$[a-zA-Z]\s*/g, " ")         // any remaining "$x" → " "
    .replace(/\s{2,}/g, " ")                    // collapse extra spaces
    .trim();
}
