import { HomeIcon } from '@t-crossword/ui';
import { useEffect, useSyncExternalStore } from 'react';
import { trackPwaInstallation } from '../adapters/pwaInstall.js';
import { wordProgressStore } from '../adapters/wordProgress.js';
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
  useEffect(trackPwaInstallation, []);
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const progress = useSyncExternalStore(wordProgressStore.subscribe, wordProgressStore.getSnapshot);
  const home = pathname === '/';
  const quiz = pathname === '/quiz';
  return <div className={`flex h-dvh flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${home ? 'mnu-ui mnu-web-home-shell' : quiz ? 'mnu-ui mnu-web-quiz-shell' : ''}`}>
    {home && <header className="mnu-web-home-header"><p>영어 낱말</p><span aria-live="polite">{progress.completedWordIds.length}개 학습</span></header>}
    <div data-page-scroll className={pathname === '/quiz' ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : pathname === '/' ? 'flex min-h-0 flex-1 flex-col overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto'}>
      <PwaStatus />
      {navigation.state !== 'idle' && <p role="status" className="p-2 text-center text-sm text-slate-600">화면을 불러오는 중입니다.</p>}
      <Outlet />
    </div>
    <nav aria-label="하단 메뉴" className="relative z-40 shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className={home ? 'mnu-web-home-nav' : `mx-auto flex h-16 w-full max-w-4xl px-4 ${quiz ? 'mnu-web-quiz-nav' : ''}`}>
        {items.map((item) => <NavLink key={item.to} to={item.to} end
          className={({ isActive }) => home ? 'mnu-web-home-nav-link' : `${quiz ? 'mnu-web-quiz-nav-link' : ''} flex flex-1 flex-col items-center justify-center gap-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
          {home ? <HomeIcon name={item.icon} /> : <MenuIcon name={item.icon} />}<span>{item.label}</span>
        </NavLink>)}
      </div>
    </nav>
  </div>;
}
