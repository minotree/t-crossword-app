/** Keep the overlay within the visible area above a software keyboard. */
export function followAnswerViewport(overlay: HTMLElement): () => void {
  const viewport = window.visualViewport;
  const update = () => {
    overlay.style.top = `${viewport?.offsetTop ?? 0}px`;
    overlay.style.bottom = 'auto';
    overlay.style.height = `${viewport?.height ?? window.innerHeight}px`;
  };
  viewport?.addEventListener('resize', update);
  window.addEventListener('resize', update);
  update();
  return () => {
    viewport?.removeEventListener('resize', update);
    window.removeEventListener('resize', update);
  };
}
