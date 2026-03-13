// Gutendex API client — free, no auth required
// https://gutendex.com/

export interface GutenbergFormat {
  [mimeType: string]: string; // mime → URL
}

export interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string; birth_year?: number; death_year?: number }>;
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  formats: GutenbergFormat;
  download_count: number;
  copyright: boolean | null;
}

export interface GutendexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutenbergBook[];
}

const GUTENDEX_BASE = "https://gutendex.com";

/** Get the best plain-text URL for a book (UTF-8 preferred) */
export function getBookTextUrl(book: GutenbergBook): string | null {
  const formats = book.formats;
  return (
    formats["text/plain; charset=utf-8"] ||
    formats["text/plain; charset=us-ascii"] ||
    formats["text/plain"] ||
    null
  );
}

/** Get cover image URL (large → medium → null) */
export function getBookCoverUrl(book: GutenbergBook): string | null {
  const formats = book.formats;
  return (
    formats["image/jpeg"] ||
    formats["image/png"] ||
    null
  );
}

/** Strip MARC subfield delimiters (e.g. " : $b ", " $c ") from Gutenberg book titles */
export function cleanMarcTitle(raw: string): string {
  return raw.replace(/\s*\$[a-z]\s*/g, " ").trim();
}

/** Primary author display name */
export function getBookAuthor(book: GutenbergBook): string {
  if (!book.authors.length) return "Unknown Author";
  // Gutenberg stores names as "Last, First" — reverse them
  const raw = book.authors[0].name;
  const parts = raw.split(", ");
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return raw;
}

/** Search Gutendex for books by query string */
export async function searchGutenberg(
  query: string,
  page = 1
): Promise<GutendexResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(page),
    // No mime_type filter here — we filter client-side via getBookTextUrl()
    // so searches return the full result set before narrowing
  });
  const res = await fetch(`${GUTENDEX_BASE}/books?${params}`, {
    next: { revalidate: 3600 }, // cache 1 hour
  });
  if (!res.ok) throw new Error(`Gutendex search failed: ${res.status}`);
  return res.json();
}

/** Fetch the most popular books (sorted by download_count descending) */
export async function getPopularGutenbergBooks(
  page = 1
): Promise<GutendexResponse> {
  const params = new URLSearchParams({
    page: String(page),
    // No mime_type filter — client filters for readable text
  });
  const res = await fetch(`${GUTENDEX_BASE}/books?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Gutendex fetch failed: ${res.status}`);
  return res.json();
}

/** Strip Project Gutenberg header/footer boilerplate from plain text */
export function stripGutenbergBoilerplate(text: string): string {
  const startMarkers = [
    "*** START OF THE PROJECT GUTENBERG EBOOK",
    "*** START OF THIS PROJECT GUTENBERG EBOOK",
    "*END*THE SMALL PRINT",
  ];
  const endMarkers = [
    "*** END OF THE PROJECT GUTENBERG EBOOK",
    "*** END OF THIS PROJECT GUTENBERG EBOOK",
    "End of the Project Gutenberg EBook",
    "End of Project Gutenberg's",
  ];

  let start = 0;
  let end = text.length;

  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      // Skip to the end of that line
      const lineEnd = text.indexOf("\n", idx);
      start = lineEnd !== -1 ? lineEnd + 1 : idx + marker.length;
      break;
    }
  }

  for (const marker of endMarkers) {
    const idx = text.lastIndexOf(marker);
    if (idx !== -1) {
      end = idx;
      break;
    }
  }

  return text.slice(start, end).trim();
}
