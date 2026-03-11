// Google Books API client — free, no auth required for basic search
// https://developers.google.com/books/docs/v1/using

export interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  publishedDate?: string;
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  categories?: string[];
  language?: string;
  previewLink?: string;
}

export interface GoogleBook {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBook[];
}

const GOOGLE_BOOKS_BASE = "https://www.googleapis.com/books/v1";

/** Search Google Books by query */
export async function searchGoogleBooks(
  query: string,
  startIndex = 0,
  maxResults = 20
): Promise<GoogleBooksResponse> {
  if (!query.trim()) return { totalItems: 0, items: [] };
  const params = new URLSearchParams({
    q: query.trim(),
    startIndex: String(startIndex),
    maxResults: String(maxResults),
    printType: "books",
    langRestrict: "en",
  });
  const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Google Books search failed: ${res.status}`);
  return res.json();
}

/** Get cover image URL, forcing HTTPS and using larger size */
export function getGoogleBookCover(book: GoogleBook): string | null {
  const links = book.volumeInfo.imageLinks;
  if (!links) return null;
  // Prefer thumbnail; fall back to smallThumbnail
  const raw = links.thumbnail ?? links.smallThumbnail ?? null;
  if (!raw) return null;
  // Google returns HTTP URLs — force HTTPS, and bump zoom for better quality
  return raw.replace(/^http:\/\//, "https://").replace("zoom=1", "zoom=2");
}

/** Primary author display name */
export function getGoogleBookAuthor(book: GoogleBook): string {
  const authors = book.volumeInfo.authors;
  if (!authors?.length) return "Unknown Author";
  // Show first two authors max
  return authors.slice(0, 2).join(", ");
}
