import type { RouteObject } from 'react-router-dom';
import { HomePage } from '../pages/HomePage.js';
import { AppLayout } from './AppLayout.js';

function RouteLoadError() {
  return <section role="alert" className="mx-auto max-w-xl p-8 text-slate-700">
    <h1 className="text-lg font-bold">화면을 불러오지 못했습니다</h1>
    <p className="mt-3">인터넷 연결을 확인한 뒤 다시 시도해 주세요.</p>
    <button type="button" onClick={() => window.location.reload()}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white">다시 불러오기</button>
  </section>;
}

export const appRoutes: RouteObject[] = [{
  path: '/',
  element: <AppLayout />,
  hydrateFallbackElement: <p role="status" className="p-8 text-slate-600">화면을 불러오는 중입니다.</p>,
  children: [
    { index: true, element: <HomePage /> },
    {
      path: 'quiz',
      lazy: async () => ({ Component: (await import('../pages/QuizPage.js')).QuizPage }),
      errorElement: <RouteLoadError />,
    },
    {
      path: 'word-bank',
      lazy: async () => ({ Component: (await import('../pages/WordBankPage.js')).WordBankPage }),
      errorElement: <RouteLoadError />,
    },
    {
      path: 'picture-books',
      lazy: async () => ({ Component: (await import('../pages/PictureBooksPage.js')).PictureBooksPage }),
      errorElement: <RouteLoadError />,
    },
    {
      path: 'settings',
      lazy: async () => ({ Component: (await import('../pages/SettingsPage.js')).SettingsPage }),
      errorElement: <RouteLoadError />,
    },
  ],
}];
