/** 모달을 열 때 이미 공개된 칸을 제외한 빈칸의 절반을 사용할 수 있다. */
export function getModalHintLimit(letters: readonly string[]): number {
  return Math.floor(letters.filter(letter => !letter).length / 2);
}

/** 입력된 정답은 건너뛰고 빈칸과 오답 중 앞쪽 칸부터 공개한다. */
export function firstIncorrectLetterIndex(answer: string, letters: readonly string[]): number {
  return Array.from(answer.toUpperCase()).findIndex((letter, index) => letter !== letters[index]?.toUpperCase());
}
