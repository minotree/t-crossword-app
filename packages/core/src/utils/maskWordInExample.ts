/** Match complete English words, including possessives, without masking substrings. */
export function maskWordInExample(example: string, answer: string): string {
  const word = answer.trim();
  if (!word) return example;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return example.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '_'.repeat(word.length));
}
