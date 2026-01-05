/**
 * Sanitize HTML content to remove iframes, scripts, and other potentially dangerous elements
 * This prevents embedded content injection and XSS attacks
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // Remove iframe tags and their content (use [\s\S] instead of . to match newlines)
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  html = html.replace(/<iframe[^>]*\/?>/gi, '');
  
  // Remove script tags and their content
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script[^>]*\/?>/gi, '');
  
  // Remove embed and object tags
  html = html.replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '');
  html = html.replace(/<embed[^>]*\/?>/gi, '');
  html = html.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  html = html.replace(/<object[^>]*\/?>/gi, '');
  
  // Remove on* event handlers (onclick, onload, etc.)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  return html;
}
