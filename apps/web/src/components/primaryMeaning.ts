export function primaryMeaning(meaning: string): string {
  let depth = 0;
  for (let index = 0; index < meaning.length; index++) {
    const character = meaning[index];
    if (character === '(' || character === '（') depth++;
    else if (character === ')' || character === '）') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (character === ',' || character === ';')) {
      return meaning.slice(0, index).trim() || meaning.trim();
    }
  }
  return meaning.trim();
}
