/**
 * 단어 스펠링 길이에 따른 최대 힌트 허용 개수 반환
 */
export const getWordHintLimit = (word: string): number => {
  const len = word.trim().length;
  
  if (len < 3) return 0;      // 3 자 미만 제외
  if (len <= 4) return 1;     // 3~4 자 -> 1 개
  if (len <= 6) return 2;     // 5~6 자 -> 2 개
  return 3;                   // 7 자 이상 -> 3 개
};
