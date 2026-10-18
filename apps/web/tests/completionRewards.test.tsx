import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { claimPuzzleCompletionReward, getSupabaseClient } from '@t-crossword/data';
import { PuzzleCompletionModal } from '../src/components/PuzzleCompletionModal.js';

afterEach(() => { vi.restoreAllMocks(); });

describe('completion reward requests', () => {
  it('uses the same round key when retried and returns the authoritative balance', async () => {
    const client = getSupabaseClient('https://example.supabase.co', 'test-public-key');
    const rpc = vi.spyOn(client, 'rpc').mockResolvedValue({
      data: 12, error: null, count: null, status: 200, statusText: 'OK',
    });
    const roundId = '12345678-1234-4234-8234-123456789abc';
    expect(await claimPuzzleCompletionReward(client, roundId)).toBe(12);
    expect(await claimPuzzleCompletionReward(client, roundId)).toBe(12);
    expect(rpc.mock.calls).toEqual([
      ['claim_puzzle_completion_reward', { p_round_id: roundId }],
      ['claim_puzzle_completion_reward', { p_round_id: roundId }],
    ]);
  });

  it('reports a failed grant instead of inventing a new balance', async () => {
    const client = getSupabaseClient('https://example.supabase.co', 'test-public-key');
    vi.spyOn(client, 'rpc').mockResolvedValue({
      data: null, error: { code: 'PGRST202', message: 'Function unavailable', details: '', hint: '' },
      count: null, status: 404, statusText: 'Not Found',
    });
    await expect(claimPuzzleCompletionReward(client, 'round-id')).rejects.toThrow('다시 시도');
  });
});

describe('completion reward feedback', () => {
  const render = (rewardStatus: 'idle' | 'pending' | 'granted' | 'error', isOpen = true) => renderToStaticMarkup(
    <PuzzleCompletionModal isOpen={isOpen} words={[]} totalHintsUsed={2}
      rewardStatus={rewardStatus} rewardError="보상 지급 실패" onRetryReward={() => {}}
      onClose={() => {}} onNewGame={() => {}} />,
  );

  it('only announces five added hints after a successful grant', () => {
    expect(render('granted')).toContain('힌트 5개가 추가되었습니다.');
    expect(render('granted')).not.toContain('disabled=""');
    for (const status of ['idle', 'pending', 'error'] as const) {
      expect(render(status)).not.toContain('힌트 5개가 추가되었습니다.');
      expect(render(status)).toContain('disabled=""');
    }
  });

  it('offers retry on failure and hides the modal after closing', () => {
    expect(render('error')).toContain('role="alert"');
    expect(render('error')).toContain('보상 다시 받기');
    expect(render('pending')).toContain('지급하고 있습니다.');
    expect(render('granted', false)).toBe('');
  });
});
