import { Link } from 'react-router-dom';
import { MenuIcon } from '../components/MenuIcon.js';

export function HomePage() {
  return <div className="flex flex-1 shrink-0 flex-col bg-white text-slate-900">
    <header className="mx-auto w-full max-w-md shrink-0 rounded-xl bg-blue-600 px-4 py-4 text-center text-white shadow-md">
      <h1 className="text-xl font-bold">영어 단어 십자낱말 풀이</h1>
    </header>
    <main className="mx-auto flex w-full max-w-md flex-1 shrink-0 flex-col items-center justify-center px-4 py-8">
      <div aria-hidden="true" className="mb-6 flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-50 shadow-lg">
        <div className="grid grid-cols-3 gap-1 text-xl font-black text-blue-600">
          {['W', 'O', 'R', '', 'D', '', '', 'S', ''].map((letter, i) => <span key={i} className={`flex h-9 w-9 items-center justify-center rounded ${letter ? 'bg-white shadow-sm' : 'bg-blue-600'}`}>{letter}</span>)}
        </div>
      </div>
      <h2 className="text-center text-xl font-bold leading-snug">영어 단어 십자낱말 풀이에<br />오신 것을 환영합니다!</h2>
      <p className="mt-4 text-center text-sm leading-relaxed text-slate-500">단어장에 저장된 단어들로 맞춤형 십자낱말 퍼즐을 즐기고 영어 실력을 키워보세요.</p>
      <div className="mt-5 grid w-full grid-cols-2 gap-3">
        <Link to="/quiz" className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-2 py-4 text-base font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><MenuIcon name="quiz" className="h-6 w-6 shrink-0" /><span>퀴즈 시작</span></Link>
        <Link to="/word-bank" className="flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-50 px-2 py-4 text-base font-bold text-blue-600 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><MenuIcon name="book" className="h-6 w-6 shrink-0" /><span>단어장 보기</span></Link>
      </div>
    </main>
  </div>;
}
