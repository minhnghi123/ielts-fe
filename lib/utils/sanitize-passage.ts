/**
 * Utility functions for sanitizing HTML content in passages and questions.
 * Removes reference numbers, artifacts, and cleans HTML for better display.
 */

/** Remove reference numbers like (1), (2), (3) from passage text */
export function removeReferenceNumbers(html: string): string {
  if (!html) return "";
  return html.replace(/\s*\((\d+)\)\s*/g, " ");
}

/** Remove instructional artifacts that pollute passages */
export function removeInstructionalArtifacts(html: string): string {
  if (!html) return "";
  const patterns = [
    /IELTS\s+(Writing|Speaking|Listening|Reading)(\s*IELTS\s+(Writing|Speaking|Listening|Reading))*/gi,
    /Skip to (main )?content/gi,
    /Click here to (continue|proceed|start)/gi,
  ];
  let cleaned = html;
  patterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });
  return cleaned;
}

/** Normalize whitespace in HTML - preserve structure */
export function normalizeWhitespace(html: string): string {
  if (!html) return "";
  // Only trim excessive whitespace, don't destroy HTML structure
  return html.trim();
}

/** Main sanitization for passages */
export function sanitizePassage(html: string): string {
  if (!html) return "";
  let cleaned = html;
  cleaned = removeReferenceNumbers(cleaned);
  cleaned = removeInstructionalArtifacts(cleaned);
  cleaned = normalizeWhitespace(cleaned);
  return cleaned;
}

/** Extract plain text from HTML for previews/tooltips */
export function extractPlainText(html: string, maxLength?: number): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
}
