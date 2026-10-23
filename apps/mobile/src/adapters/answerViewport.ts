export function answerViewport(height: number, offsetTop: number, dialogHeight: number) {
  const maxHeight = Math.max(0, height - 16);
  return { maxHeight, top: offsetTop + Math.max(8, (height - Math.min(dialogHeight, maxHeight)) / 2) };
}

/** Use the visible viewport, which shrinks above an Android software keyboard. */
export function followAnswerViewport(dialog: HTMLDialogElement): () => void {
  const viewport = window.visualViewport;
  let frame = 0;
  const update = () => {
    const height = viewport?.height ?? window.innerHeight;
    const offset = viewport?.offsetTop ?? 0;
    dialog.style.maxHeight = `${Math.max(0, height - 16)}px`;
    const { top } = answerViewport(height, offset, dialog.offsetHeight);
    dialog.style.position = 'fixed';
    dialog.style.inset = `${top}px 0 auto`;
    dialog.style.margin = '0 auto';
  };
  const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
  const observer = new ResizeObserver(schedule);
  observer.observe(dialog);
  viewport?.addEventListener('resize', schedule);
  window.addEventListener('resize', schedule);
  update();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    viewport?.removeEventListener('resize', schedule);
    window.removeEventListener('resize', schedule);
    dialog.removeAttribute('style');
  };
}
