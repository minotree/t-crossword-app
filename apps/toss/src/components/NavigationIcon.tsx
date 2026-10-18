export function NavigationIcon({ name }: { name: 'home' | 'quiz' | 'words' | 'books' | 'settings' }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {name === 'home' && <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></>}
    {name === 'quiz' && <><path d="M7 7h10c3 0 4 4 4 8 0 3-2 4-4 1l-1-1H8l-1 1c-2 3-4 2-4-1 0-4 1-8 4-8Z" /><path d="M8 9v4m-2-2h4m6-1h.01m2 3h.01" /></>}
    {name === 'words' && <><path d="M12 5v16m0-16C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 1Z" /></>}
    {name === 'books' && <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><path d="m4 18 6-6 4 4 3-3 4 5" /></>}
    {name === 'settings' && <><path d="m9 3-1 3-3 1v4l-2 1 2 3 3 1 1 5h6l1-5 3-1 2-3-2-1V7l-3-1-1-3Z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>;
}
