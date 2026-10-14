// ──────────────────────────────────────────────
// 기본 값 타입 (Value Types)
// ──────────────────────────────────────────────

/** 그리드 내 위치 */
export interface Position {
  row: number;
  col: number;
}

/** 낱말 방향 */
export type Direction = 'across' | 'down';

/** 셀 종류 */
export type CellType = 'letter' | 'black';

// ──────────────────────────────────────────────
// 그리드 / 셀
// ──────────────────────────────────────────────

/** 퍼즐 그리드의 단일 셀 */
export interface Cell {
  position: Position;
  type: CellType;
  /** 정답 음절 (type === 'letter'일 때만 존재) */
  answer?: string;
  /** 번호 표시 (단어 시작 셀) */
  number?: number;
}

/** 퍼즐 그리드 (행 × 열 2차원 배열) */
export type Grid = Cell[][];

// ──────────────────────────────────────────────
// 단어 / 단서
// ──────────────────────────────────────────────

/** 퍼즐 내 낱말 항목 */
export interface WordEntry {
  number: number;
  direction: Direction;
  startPosition: Position;
  length: number;
  /** 힌트/단서 문구 */
  clue: string;
  /** 정답 (음절 배열, 예: ['사', '과']) */
  answer: string[];
}

// ──────────────────────────────────────────────
// 퍼즐 엔티티
// ──────────────────────────────────────────────

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
export type PuzzleStatus = 'draft' | 'published' | 'archived';

/** 퍼즐 메타데이터 */
export interface PuzzleMeta {
  id: string;
  title: string;
  description?: string;
  difficulty: PuzzleDifficulty;
  status: PuzzleStatus;
  rows: number;
  cols: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

/** 전체 퍼즐 (메타 + 그리드 + 단어 목록) */
export interface Puzzle extends PuzzleMeta {
  grid: Grid;
  words: WordEntry[];
}

// ──────────────────────────────────────────────
// 퍼즐 풀이 (세션 없음 — 클라이언트 임시 상태)
// ──────────────────────────────────────────────

/** 사용자가 입력한 셀 값 (position key: "row,col") */
export type CellInputMap = Record<string, string>;

// ──────────────────────────────────────────────
// 사용자
// ──────────────────────────────────────────────

export interface User {
  id: string;
  nickname: string;
  email?: string;
  createdAt: string;
}
