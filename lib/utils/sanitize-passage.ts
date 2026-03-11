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

/**
 * Fix broken line breaks: remove stray <br> tags that split sentences
 * mid-word or mid-phrase, while preserving intentional paragraph breaks.
 */
export function fixBrokenLineBreaks(html: string): string {
  if (!html) return "";
  let cleaned = html;

  // Replace <br> between two lowercase words (mid-sentence break)
  cleaned = cleaned.replace(
    /([a-zA-Z,;:])\s*<br\s*\/?>\s*([a-z])/gi,
    "$1 $2",
  );

  // Remove <br> immediately after opening tags or before closing tags
  cleaned = cleaned.replace(/<(p|div|li|h[1-6])([^>]*)>\s*<br\s*\/?>/gi, "<$1$2>");
  cleaned = cleaned.replace(/<br\s*\/?>\s*<\/(p|div|li|h[1-6])>/gi, "</$1>");

  // Collapse 3+ consecutive <br> into a paragraph break
  cleaned = cleaned.replace(/(<br\s*\/?>[\s]*){3,}/gi, "</p><p>");

  // Replace double <br> with paragraph break (natural paragraph separation)
  cleaned = cleaned.replace(/(<br\s*\/?>[\s]*){2}/gi, "</p><p>");

  return cleaned;
}

/** Remove orphaned empty tags and excessive whitespace in HTML */
export function cleanEmptyElements(html: string): string {
  if (!html) return "";
  let cleaned = html;

  // Remove empty <p>, <div>, <span> tags (with only whitespace/&nbsp; inside)
  cleaned = cleaned.replace(/<(p|div|span)([^>]*)>\s*(&nbsp;|\s)*\s*<\/\1>/gi, "");

  // Collapse multiple &nbsp; into a single space
  cleaned = cleaned.replace(/(&nbsp;\s*){2,}/gi, " ");

  // Remove leading/trailing &nbsp; inside paragraphs
  cleaned = cleaned.replace(/<p([^>]*)>\s*&nbsp;\s*/gi, "<p$1>");
  cleaned = cleaned.replace(/\s*&nbsp;\s*<\/p>/gi, "</p>");

  return cleaned;
}

/** Normalize whitespace in HTML - preserve structure */
export function normalizeWhitespace(html: string): string {
  if (!html) return "";
  let cleaned = html.trim();
  // Collapse runs of whitespace (outside tags) into single spaces
  cleaned = cleaned.replace(/(?<=>)\s{2,}(?=<)/g, " ");
  return cleaned;
}

/** Main sanitization for passages */
export function sanitizePassage(html: string): string {
  if (!html) return "";
  let cleaned = html;
  cleaned = removeReferenceNumbers(cleaned);
  cleaned = removeInstructionalArtifacts(cleaned);
  cleaned = fixBrokenLineBreaks(cleaned);
  cleaned = cleanEmptyElements(cleaned);
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
