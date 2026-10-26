/**
 * Helpers to work with the rich body of a mail.
 *
 * The backend derives the plain-text body from the rich one, but the UI still
 * needs a cheap way to know whether a body has any content before enabling the
 * "send" button.
 */

const TAG_PATTERN = /<\/?[a-z][^>]*>/gi;

/**
 * Strips the markup of a rich body and returns its readable text.
 *
 * The result is only used to decide whether a body is empty, so the conversion
 * stays deliberately simple.
 */
export function htmlToPlainText(html: string): string {
  if (!html) {
    return '';
  }

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(TAG_PATTERN, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Tells whether a rich body carries any content. */
export function hasHtmlContent(html: string): boolean {
  if (!html || !html.trim()) {
    return false;
  }

  if (/<(img|video)\b/i.test(html)) {
    return true;
  }

  return htmlToPlainText(html).length > 0;
}

/**
 * Wraps a plain-text body into a simple rich body.
 *
 * Templates created before the rich editor existed only store plain text, so
 * they are converted before being loaded into the editor.
 */
export function plainTextToHtml(text: string): string {
  if (!text || !text.trim()) {
    return '';
  }

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
}
