import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@toss/tds-mobile';

export function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
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
