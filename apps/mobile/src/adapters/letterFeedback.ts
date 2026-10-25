/** Incorrect English letters receive red feedback on every edit. */
export function letterFeedback(letter: string, expected: string) {
  return { highlight: /^[A-Z]$/.test(letter) && letter !== expected.toUpperCase() };
}

export function updateIncorrectCells(previous: number[], index: number, highlight: boolean): number[] {
  return [...previous.filter(position => position !== index), ...(highlight ? [index] : [])];
}
