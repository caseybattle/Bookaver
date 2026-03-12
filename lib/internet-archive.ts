// Internet Archive / Open Library client
// Search API: https://openlibrary.org/search.json (free, no key)
// Downloads: https://archive.org/download/{identifier}/{filename}

export interface IABook {
  // From Open Library search response
  key: string;          // e.g. "/works/OL45804W"
  title: string;
  author_name?: string[];
  ia?: string[];         // Internet Archive identifiers — REQUIRED for free download
  first_publish_year?: number;
  cover_i?: number;      // Cover image ID for covers.openlibrary.org
}

export interface IASearchResponse {
  numFound: number;
  start: number;
  docs: IABook[];
}

/** Get cover URL for an IA book (uses Open Library covers CDN) */
export function getIACoverUrl(book: IABook): string | null {
  if (book.cover_i) {
    return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
  }
  return null;
}

/** Primary author display name */
export function getIAAuthor(book: IABook): string {
  return book.author_name?.[0] ?? "Unknown Author";
}

/** Primary IA identifier */
export function getIAIdentifier(book: IABook): string | null {
  return book.ia?.[0] ?? null;
}

/**
 * Search Open Library for freely downloadable books.
 * Uses `ebook_access=public` to only return books with free full-text downloads.
 */
export async function searchInternetArchive(
  query: string,
  page = 1
): Promise<IASearchResponse> {
  const limit = 20;
  const offset = (page - 1) * limit;
  const params = new URLSearchParams({
    q: query,
    ebook_access: "public",
    fields: "key,title,author_name,ia,first_publish_year,cover_i",
    limit: String(limit),
    offset: String(offset),
    language: "eng",
  });
  const res = await fetch(
    `https://openlibrary.org/search.json?${params}`,
    {
      headers: { "User-Agent": "Bookaver/1.0 (https://bookaver.vercel.app)" },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);
  return res.json() as Promise<IASearchResponse>;
}

/**
 * Find the best plain-text URL for an IA book.
 * Checks the IA files metadata to find a _djvu.txt (OCR plain text) file.
 * Returns null if no text file is found.
 */
export async function getIATextUrl(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://archive.org/metadata/${identifier}/files`,
      { headers: { "User-Agent": "Bookaver/1.0 (https://bookaver.vercel.app)" } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { result?: Array<{ name: string; format?: string }> };
    // Find a _djvu.txt file (OCR plain text — standard IA format)
    const files: Array<{ name: string; format?: string }> = data.result ?? [];
    const djvuTxt = files.find(
      (f) => f.name.endsWith("_djvu.txt") || f.format === "DjVuTXT"
    );
    if (djvuTxt) {
      return `https://archive.org/download/${identifier}/${encodeURIComponent(djvuTxt.name)}`;
    }
    // Fallback: look for any plain text file
    const plainTxt = files.find(
      (f) =>
        f.name.endsWith(".txt") &&
        !f.name.includes("meta") &&
        !f.name.includes("_files")
    );
    if (plainTxt) {
      return `https://archive.org/download/${identifier}/${encodeURIComponent(plainTxt.name)}`;
    }
    return null;
  } catch {
    return null;
  }
}
