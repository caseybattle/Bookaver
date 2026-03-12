import { describe, it, expect } from "vitest";
import { sanitizeMarcTitle, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// sanitizeMarcTitle
//
// The function strips MARC subfield MARKERS (e.g. "$b", "$c") but retains
// the text that follows the marker. Regex breakdown:
//   1. /\s*:\s*\$[a-zA-Z]\s*/g  → " : $b " becomes ": "   (colon kept)
//   2. /\s*\/\s*\$[a-zA-Z]\s*/g  → " / $c " becomes " "   (slash dropped)
//   3. /\s*\$[a-zA-Z]\s*/g       → any remaining "$x " becomes " "
//   4. /\s{2,}/g                  → collapse multiple spaces
//   Then .trim()
// ---------------------------------------------------------------------------
describe("sanitizeMarcTitle", () => {
  it("strips ': $b' colon-subfield separator and retains the following text", () => {
    expect(
      sanitizeMarcTitle(
        "Religion and the rise of capitalism : $b A historical study"
      )
    ).toBe("Religion and the rise of capitalism: A historical study");
  });

  it("strips '/ $c' slash-subfield marker and retains the following text", () => {
    // " / $c Herman Melville" → " " + "Herman Melville" → "Moby Dick Herman Melville"
    expect(sanitizeMarcTitle("Moby Dick / $c Herman Melville")).toBe(
      "Moby Dick Herman Melville"
    );
  });

  it("strips bare $c subfield marker mid-string", () => {
    // "$c " → " " → collapses to single space
    expect(sanitizeMarcTitle("The Great Gatsby $c F. Scott Fitzgerald")).toBe(
      "The Great Gatsby F. Scott Fitzgerald"
    );
  });

  it("strips a $a prefix subfield marker", () => {
    // "$a " at start → " " → trim → no leading space
    expect(sanitizeMarcTitle("$a Some prefixed title")).toBe(
      "Some prefixed title"
    );
  });

  it("leaves a plain title untouched", () => {
    expect(sanitizeMarcTitle("Normal Title")).toBe("Normal Title");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeMarcTitle("")).toBe("");
  });

  it("strips multiple colon-subfield markers in sequence", () => {
    // ": $b" + ": $b" → ": " + ": "
    expect(sanitizeMarcTitle("Title : $b Subtitle : $b Part Two")).toBe(
      "Title: Subtitle: Part Two"
    );
  });

  it("handles mixed colon and slash subfield markers", () => {
    // "History $b Of The World" → "History Of The World" (bare $b removed)
    // ": $b Part II" → ": Part II"
    // "/ $c Mel Brooks" → " Mel Brooks"
    expect(
      sanitizeMarcTitle(
        "History $b Of The World : $b Part II / $c Mel Brooks"
      )
    ).toBe("History Of The World: Part II Mel Brooks");
  });

  it("collapses multiple interior spaces introduced after stripping", () => {
    // Both "$b " and "$c " get replaced by spaces; collapse step normalises
    expect(sanitizeMarcTitle("Title : $b  $c Extra")).toBe("Title: Extra");
  });

  it("trims leading and trailing whitespace from the result", () => {
    expect(sanitizeMarcTitle("  Trimmed Title  ")).toBe("Trimmed Title");
  });

  it("handles a title with no subfield codes and special chars intact", () => {
    const title = "The C++ Programming Language, 4th Ed.";
    expect(sanitizeMarcTitle(title)).toBe(title);
  });

  it("handles $z (geographic subfield) correctly", () => {
    expect(sanitizeMarcTitle("Title $z Boston")).toBe("Title Boston");
  });

  it("handles uppercase subfield letter $B", () => {
    // regex is [a-zA-Z] so uppercase is also matched
    expect(sanitizeMarcTitle("Title $B Subtitle")).toBe("Title Subtitle");
  });
});

// ---------------------------------------------------------------------------
// cn (className utility)
// ---------------------------------------------------------------------------
describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge resolves padding conflicts: p-2 and p-4 → p-4
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string when nothing is passed", () => {
    expect(cn()).toBe("");
  });

  it("handles object syntax from clsx", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500"
    );
  });

  it("handles array syntax from clsx", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center");
  });
});
