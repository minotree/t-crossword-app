import { NavLink, Outlet, useLocation, useNavigation } from 'react-router-dom';
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
  const navigation = useNavigation();
  const { pathname } = useLocation();
  return <div className="flex h-dvh flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
    <div data-page-scroll className={pathname === '/quiz' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto'}>
      <PwaStatus />
      {navigation.state !== 'idle' && <p role="status" className="p-2 text-center text-sm text-slate-600">화면을 불러오는 중입니다.</p>}
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
