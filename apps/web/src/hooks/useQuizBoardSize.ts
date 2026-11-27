import { useEffect, useRef, useState, type RefObject } from 'react';
import type { GridSize } from '@t-crossword/core';

const minimumBoardSize = { 8: 292, 10: 322, 12: 360 };

export function calculateQuizBoardSize(width: number, height: number, gridSize: GridSize, preservePortraitWidth: boolean, maximumSize = 600) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0) return undefined;
  return Math.floor(Math.min(width, maximumSize, preservePortraitWidth ? width : Math.max(minimumBoardSize[gridSize], height)));
}

interface QuizBoardSizeOptions {
  mainRef: RefObject<HTMLElement | null>;
  stackRef: RefObject<HTMLDivElement | null>;
  hintsButtonRef: RefObject<HTMLButtonElement | null>;
  encouragementRef: RefObject<HTMLDivElement | null>;
  gridSize: GridSize;
  puzzleVersion: number;
  hasPuzzle: boolean;
  paused: boolean;
}

/** Measure app-owned content, never the board or flex-stretched encouragement slot. */
export function useQuizBoardSize({ mainRef, stackRef, hintsButtonRef, encouragementRef,
  gridSize, puzzleVersion, hasPuzzle, paused }: QuizBoardSizeOptions) {
  const [boardSize, setBoardSize] = useState<number>();
  const acceptedViewport = useRef<{ width: number; height: number } | undefined>(undefined);
  const keyboardClosing = useRef(false);
  useEffect(() => {
    if (paused) { keyboardClosing.current = true; return; }
    if (!hasPuzzle) return;
    const main = mainRef.current;
    const stack = stackRef.current;
    const button = hintsButtonRef.current;
    if (!main || !stack || !button) return;
    let disposed = false;
    let frame = 0;
    const viewport = window.visualViewport;
    const px = (value: string) => parseFloat(value) || 0;
    const measure = () => {
      if (disposed) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && (active.matches('input, textarea') || active.isContentEditable)) return;
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const previous = acceptedViewport.current;
      if (keyboardClosing.current && previous && Math.abs(window.innerWidth - previous.width) < 2 && visibleHeight < previous.height * .8) return;
      const style = getComputedStyle(main);
      const stackStyle = getComputedStyle(stack);
      const twoColumns = stackStyle.display === 'grid';
      // Resolved grid tracks are independent of board size (minmax(0, ...) in CSS).
      const leftColumnWidth = twoColumns ? px(stackStyle.gridTemplateColumns) : stack.clientWidth;
      const width = Math.min(leftColumnWidth, stack.clientWidth, main.clientWidth - px(style.paddingLeft) - px(style.paddingRight));
      // Scroll-independent offset includes any recommendation/error above the stack.
      const before = stack.getBoundingClientRect().top - main.getBoundingClientRect().top - main.clientTop + main.scrollTop;
      const encouragement = encouragementRef.current;
      const encouragementHeight = encouragement?.getBoundingClientRect().height ?? 0;
      const contentHeight = main.clientHeight - before - px(style.paddingBottom);
      // Bound the persistent list by the viewport, not its own scroll content.
      const publishHeight = (name: string, value: number) => {
        const nextValue = `${Math.max(0, Math.floor(value))}px`;
        if (stack.style.getPropertyValue(name) !== nextValue) stack.style.setProperty(name, nextValue);
      };
      publishHeight('--mnu-web-quiz-available-height', contentHeight);
      publishHeight('--mnu-web-quiz-encouragement-height', Math.ceil(encouragementHeight));
      const gap = px(stackStyle.rowGap);
      const controlsHeight = twoColumns ? 0 : button.getBoundingClientRect().height
        + encouragementHeight + gap * (encouragement ? 2 : 1);
      const height = contentHeight - controlsHeight;
      const preservePortraitWidth = window.innerWidth < 768 && window.innerHeight >= window.innerWidth;
      const next = calculateQuizBoardSize(width, height, gridSize, preservePortraitWidth, twoColumns ? 800 : 600);
      if (next === undefined) return;
      keyboardClosing.current = false;
      acceptedViewport.current = { width: window.innerWidth, height: visibleHeight };
      setBoardSize(previousSize => previousSize === next ? previousSize : next);
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
    observer?.observe(main);
    observer?.observe(button);
    const encouragement = encouragementRef.current;
    if (encouragement) observer?.observe(encouragement);
    const observedNotices = new Set<Element>();
    const observeNotices = () => {
      for (const element of observedNotices) observer?.unobserve(element);
      observedNotices.clear();
      for (const element of main.children) {
        if (element !== stack) { observer?.observe(element); observedNotices.add(element); }
      }
      schedule();
    };
    // Notices mount/unmount without necessarily changing the main's own height.
    const mutations = new MutationObserver(observeNotices);
    mutations.observe(main, { childList: true });
    observeNotices();
    window.addEventListener('resize', schedule);
    viewport?.addEventListener('resize', schedule);
    document.addEventListener('focusout', schedule);
    void document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
      viewport?.removeEventListener('resize', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, [mainRef, stackRef, hintsButtonRef, encouragementRef, gridSize, puzzleVersion, hasPuzzle, paused]);
  return boardSize;
}
