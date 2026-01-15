/**
 * Count characters in a string
 * @param text - The text to count
 * @returns The number of characters
 */
export function countCharacters(text: string | null | undefined): number {
  if (!text) return 0;
  return text.length;
}
