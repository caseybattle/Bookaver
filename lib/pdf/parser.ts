import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Use legacy build with no worker (server-side safe)
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

const CHUNK_WORD_LIMIT = 500;

export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += CHUNK_WORD_LIMIT) {
    const chunk = words.slice(i, i + CHUNK_WORD_LIMIT).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
  }

  return chunks;
}

export interface ParsedSegment {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
}

export async function extractAndSegmentPDF(
  buffer: ArrayBuffer
): Promise<ParsedSegment[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  let allText = "";
  const pageBreaks: { afterChar: number; page: number }[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as Array<{ str?: string }>)
      .filter((item): item is { str: string } => typeof item.str === "string")
      .map((item) => item.str)
      .join(" ");

    pageBreaks.push({ afterChar: allText.length + pageText.length, page: pageNum });
    allText += pageText + " ";
  }

  const chunks = chunkText(allText);

  const words = allText.trim().split(/\s+/);
  return chunks.map((content, chunkIndex) => {
    const startWordIndex = chunkIndex * CHUNK_WORD_LIMIT;
    const charOffset = words.slice(0, startWordIndex).join(" ").length;
    const pb = pageBreaks.find((p) => p.afterChar >= charOffset);
    return { content, chunkIndex, pageNumber: pb?.page };
  });
}
