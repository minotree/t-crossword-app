import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@toss/tds-mobile';

export function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const viewport = window.visualViewport;
    let frame = 0;
    let keyboardTop: number | null = null;
    const updateViewport = () => {
      if (!element || !viewport) return;
      element.style.position = 'fixed';
      // Focus changes can pan iOS's viewport; keep one anchor per keyboard opening.
      keyboardTop ??= viewport.offsetTop + 8;
      element.style.inset = `${keyboardTop}px 0 auto`;
      element.style.margin = '0 auto';
      element.style.maxHeight = `${Math.max(0, viewport.height - 16)}px`;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateViewport); };
    // Keep normal dialog centering until the keyboard reduces the visible area.
    const sync = () => {
      if (viewport && viewport.height < window.innerHeight - 100) schedule();
      else if (element) {
        cancelAnimationFrame(frame);
        keyboardTop = null;
        element.removeAttribute('style');
      }
    };
    viewport?.addEventListener('resize', sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', sync);
      element?.close();
    };
  }, []);
  return <dialog ref={dialog} className={`modal ${className}`} aria-labelledby="modal-title" onCancel={(event) => {
    event.preventDefault();
    onClose();
  }}>
    <div className="modal-heading">
      <h2 id="modal-title">{title}</h2>
      <Button size="small" variant="weak" onClick={onClose} aria-label="창 닫기">닫기</Button>
    </div>
    {children}
  </dialog>;
}
