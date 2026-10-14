import type { WordItem } from '../types/index.js';

export class WordBankService {
  private vocabList: WordItem[] = [];

  constructor(initialVocabList?: WordItem[]) {
    if (initialVocabList) {
      this.vocabList = initialVocabList;
    }
  }

  getAllWords(): WordItem[] {
    return this.vocabList;
  }

  getWordsByLevel(level: 'beginner' | 'intermediate' | 'advanced'): WordItem[] {
    return this.vocabList.filter((word) => word.level === level);
  }

  searchWords(query: string): WordItem[] {
    const lowerQuery = query.toLowerCase();
    return this.vocabList.filter((word) => 
      word.word.toLowerCase().includes(lowerQuery) ||
      word.meaning.toLowerCase().includes(lowerQuery) ||
      word.example.toLowerCase().includes(lowerQuery)
    );
  }

  toggleBookmark(wordId: string): WordItem[] {
    const word = this.vocabList.find((w) => w.id === wordId);
    if (word) {
      word.isBookmarked = !word.isBookmarked;
    }
    return this.getAllWords();
  }

  markWordAsUsed(wordId: string): WordItem[] {
    const word = this.vocabList.find((w) => w.id === wordId);
    if (word) {
      word.isQuizUsed = true;
    }
    return this.getAllWords();
  }
}
