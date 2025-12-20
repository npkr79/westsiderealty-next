/**
 * Truncate text to a maximum number of words
 * @param text - The text to truncate
 * @param maxWords - Maximum number of words (default: 500)
 * @returns Truncated text with ellipsis if truncated
 */
export function truncateWords(text: string | null | undefined, maxWords: number = 500): string {
  if (!text) return '';
  
  // Remove HTML tags and clean up whitespace
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (!cleanText) return '';
  
  // Split into words
  const words = cleanText.split(/\s+/);
  
  // If text is already within limit, return as-is
  if (words.length <= maxWords) {
    return cleanText;
  }
  
  // Truncate to maxWords and add ellipsis
  const truncated = words.slice(0, maxWords).join(' ');
  
  // Try to end at a sentence boundary if possible
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  // If we found a sentence end within the last 50 characters, use it
  if (lastSentenceEnd > truncated.length - 50 && lastSentenceEnd > 0) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Otherwise, just add ellipsis
  return truncated + '...';
}

/**
 * Count words in a text string
 * @param text - The text to count
 * @returns Number of words
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (!cleanText) return 0;
  
  return cleanText.split(/\s+/).length;
}

