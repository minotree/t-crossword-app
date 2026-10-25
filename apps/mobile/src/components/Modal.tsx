import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="mobile-quiz-modal" aria-labelledby="mobile-quiz-modal-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="mobile-hint-overlay-heading"><h2 id="mobile-quiz-modal-title">{title}</h2><button type="button" onClick={onClose}>닫기</button></div>
    {children}
  </dialog>;
}
