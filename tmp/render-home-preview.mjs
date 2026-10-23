import { readFile, writeFile } from 'node:fs/promises';
import { transformWithEsbuild } from '../apps/toss/node_modules/vite/dist/node/index.js';
const source = await readFile('apps/toss/src/App.tsx', 'utf8');
const start = source.indexOf('<section className="home-welcome"');
const home = source.slice(start, source.indexOf('</section>', start) + 10);
const icon = await readFile('apps/toss/src/components/NavigationIcon.tsx','utf8');
const entry = `import { createRequire } from 'node:module';
const require = createRequire(new URL('../apps/toss/package.json', import.meta.url));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Button } = require('@toss/tds-mobile');
const { TDSMobileAITProvider } = require('@toss/tds-mobile-ait');
${icon}
const isGameBusy=false, openQuiz=()=>{}, setPage=()=>{};
export const markup = renderToStaticMarkup(<TDSMobileAITProvider brandPrimaryColor="#3182f6"><div className="app-shell">
<header className="app-heading"><h1>영어 퍼즐</h1><div className="wallet-heading"><span>24개 학습</span><strong>💡 31개</strong></div></header>
<main className="scroll-page">${home}</main>
<nav className="bottom-navigation">{[['home','홈'],['quiz','퀴즈 풀기'],['words','단어장'],['books','그림책'],['settings','설정']].map(([name,label])=><Button key={name} size="medium" variant="weak" aria-current={name==='home'?'page':undefined}><span className="navigation-item"><NavigationIcon name={name}/>{label}</span></Button>)}</nav>
<aside className="ad-banner"><div className="mock-ad"><span className="mock-ad-icon">⚡</span><div><b>테스트 광고</b><p>테스트 광고 문구 · AD</p><small>심의필 2025-광고-00001</small></div></div></aside>
</div></TDSMobileAITProvider>);`;
const transformed = await transformWithEsbuild(entry, 'preview.tsx', { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' });
await writeFile('tmp/home-preview-entry.mjs',transformed.code);
{
  const { markup } = await import('./home-preview-entry.mjs');
  const css = await readFile('apps/toss/src/styles.css','utf8');
  const extra = `.status{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 26px;font-size:19px;font-weight:700}.capsule{position:absolute;top:52px;right:12px;background:#777;color:white;border-radius:30px;font-size:25px;padding:2px 14px}.app-shell{height:calc(100dvh - 52px);padding-bottom:34px}.mock-ad{display:flex;align-items:center;gap:12px;background:#17171b;color:#bfc0c5;padding:16px 20px}.mock-ad-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#263044;font-size:26px}.mock-ad b{font-size:16px}.mock-ad p{font-size:13px;margin-top:4px}.mock-ad small{font-size:9px;color:#777;margin-top:8px;display:block}`;
  await writeFile('tmp/home-preview.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n${extra}</style><body><div class="status"><span>12:28</span><span>▮▮▮  Wi-Fi  ▰</span></div><div class="capsule">··· │ ×</div>${markup}</body></html>`);
  console.log('Created tmp/home-preview.html using current home JSX, CSS and TDS. Native chrome and ad are placeholders.');
}
