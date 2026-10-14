import type { WordItem } from '../types/index.js';
import vocabData from './vocab.json' with { type: 'json' };

export const defaultVocabList: WordItem[] = vocabData as WordItem[];
