export type MenuIconName = 'home' | 'quiz' | 'book' | 'picture-book' | 'settings';

export function MenuIcon({ name, className = 'h-6 w-6' }: { name: MenuIconName; className?: string }) {
  const paths = {
    home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
    quiz: 'M8 7h8c4 0 5 4 6 10 .4 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.4 1-4-2 1-6 2-10 6-10ZM7 10v6M4 13h6M16 11h.01M19 14h.01',
    book: 'M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1Z',
    'picture-book': 'M4 3h16v18H4zM7 16l3-4 3 3 2-2 2 3M8 7h.01M7 19h10',
    settings: 'm10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3h-4Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={paths[name]} /></svg>;
}
