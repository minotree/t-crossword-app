import { NavLink, Outlet } from 'react-router-dom';
import { MenuIcon, type MenuIconName } from '../components/MenuIcon.js';
import { PwaStatus } from '../components/PwaStatus.js';

const items: { to: string; label: string; icon: MenuIconName }[] = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/quiz', label: '퀴즈 풀기', icon: 'quiz' },
  { to: '/word-bank', label: '단어장', icon: 'book' },
  { to: '/picture-books', label: '그림책', icon: 'picture-book' },
  { to: '/settings', label: '설정', icon: 'settings' },
];

export function AppLayout() {
  return <div className="flex h-dvh flex-col overflow-hidden bg-white">
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PwaStatus />
      <Outlet />
    </div>
    <nav aria-label="하단 메뉴" className="relative z-40 shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 w-full max-w-4xl px-4">
        {items.map((item) => <NavLink key={item.to} to={item.to} end
          className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
          <MenuIcon name={item.icon} /><span>{item.label}</span>
        </NavLink>)}
      </div>
    </nav>
  </div>;
}
