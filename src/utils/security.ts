/**
 * Sanitizes a URL string to prevent XSS attacks (e.g. javascript: URLs).
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '';
  }
  return trimmed;
}
