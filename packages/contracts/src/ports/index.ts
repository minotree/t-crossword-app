import type { Puzzle, PuzzleMeta, PuzzleDifficulty, PuzzleStatus } from '../domain/index.js';

// ──────────────────────────────────────────────
// 퍼즐 저장소 포트
// ──────────────────────────────────────────────

export interface ListPuzzlesFilter {
  difficulty?: PuzzleDifficulty;
  status?: PuzzleStatus;
  creatorId?: string;
  limit?: number;
  offset?: number;
}

export interface IPuzzleRepository {
  /** 퍼즐 목록 조회 */
  list(filter: ListPuzzlesFilter): Promise<PuzzleMeta[]>;
  /** 단일 퍼즐 조회 (그리드 + 단어 포함) */
  findById(id: string): Promise<Puzzle | null>;
  /** 퍼즐 저장 (신규 생성) */
  create(puzzle: Omit<Puzzle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Puzzle>;
  /** 퍼즐 수정 */
  update(id: string, patch: Partial<Omit<Puzzle, 'id' | 'creatorId' | 'createdAt'>>): Promise<Puzzle>;
  /** 퍼즐 삭제 */
  delete(id: string): Promise<void>;
}

// ──────────────────────────────────────────────
// 인증 포트
// ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email?: string;
}

export interface IAuthPort {
  /** 현재 로그인 사용자 반환 (없으면 null) */
  getCurrentUser(): Promise<AuthUser | null>;
  /** 로그아웃 */
  signOut(): Promise<void>;
}
