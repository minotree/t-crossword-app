import type { IPuzzleRepository, ListPuzzlesFilter } from '@t-crossword/contracts';
import type { Puzzle, PuzzleMeta } from '@t-crossword/contracts';

// ──────────────────────────────────────────────
// 퍼즐 목록 조회
// ──────────────────────────────────────────────

export async function listPuzzles(
  repo: IPuzzleRepository,
  filter: ListPuzzlesFilter = {},
): Promise<PuzzleMeta[]> {
  return repo.list(filter);
}

// ──────────────────────────────────────────────
// 퍼즐 상세 조회
// ──────────────────────────────────────────────

export async function getPuzzle(
  repo: IPuzzleRepository,
  id: string,
): Promise<Puzzle> {
  const puzzle = await repo.findById(id);
  if (!puzzle) {
    throw new Error(`퍼즐을 찾을 수 없습니다: ${id}`);
  }
  return puzzle;
}

// ──────────────────────────────────────────────
// 퍼즐 생성
// ──────────────────────────────────────────────

export async function createPuzzle(
  repo: IPuzzleRepository,
  data: Omit<Puzzle, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Puzzle> {
  return repo.create(data);
}

// ──────────────────────────────────────────────
// 퍼즐 삭제
// ──────────────────────────────────────────────

export async function deletePuzzle(
  repo: IPuzzleRepository,
  id: string,
): Promise<void> {
  return repo.delete(id);
}
