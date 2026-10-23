/** Red feedback is limited per open input session; typing remains available after exhaustion. */
export function letterFeedback(letter: string, expected: string, remaining: number) {
  const highlight = /^[A-Z]$/.test(letter) && letter !== expected && remaining > 0;
  return { highlight, remaining: highlight ? remaining - 1 : remaining };
}

export function updateIncorrectCells(previous: number[], index: number, highlight: boolean): number[] {
  return [...previous.filter(position => position !== index), ...(highlight ? [index] : [])];
}
