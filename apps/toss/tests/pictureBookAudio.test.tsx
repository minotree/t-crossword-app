// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePictureBookAudio } from '../src/adapters/usePictureBookAudio.js';
import { PictureBookAudio } from '../src/components/PictureBookAudio.js';
const ads = vi.hoisted(() => ({ show: vi.fn(async () => {}) }));
vi.mock('../src/adapters/interstitialAd.js', () => ({ useInterstitialAd: () => ads }));
vi.mock('@toss/tds-mobile', () => ({ Button: ({ children, variant: _variant, size: _size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => <button {...props}>{children}</button> }));
const id='beginner-01-01', text='A new day.', hash='a'.repeat(64);
let root: Root, host: HTMLDivElement, elements: HTMLAudioElement[];
function Reader({ page=id }: {page?: string}) {
  const audio=usePictureBookAudio(page,text,'https://audio.example.com/picture-book-audio/');
  return <>{([1,5,10] as const).map(count=><button key={count} onClick={()=>void audio.play(count)}>{count}</button>)}<p>{audio.status}</p></>;
}
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); elements=[]; ads.show.mockReset().mockResolvedValue();
  HTMLDialogElement.prototype.showModal=function(){this.open=true;}; HTMLDialogElement.prototype.close=function(){this.open=false;};
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[{id,text,sha256:hash,file:`${id}-${hash.slice(0,16)}.mp3`}]})));
  vi.stubGlobal('Audio',function(){const audio=document.createElement('audio');vi.spyOn(audio,'play').mockResolvedValue();vi.spyOn(audio,'pause').mockImplementation(()=>{});vi.spyOn(audio,'load').mockImplementation(()=>{});elements.push(audio);return audio;});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
async function click(index:number){await act(async()=>host.querySelectorAll('button')[index].click());}
it.each([1,5,10] as const)('plays exactly %i times at normal speed',async count=>{
  vi.useFakeTimers();await act(async()=>root.render(<Reader/>));expect(fetch).not.toHaveBeenCalled();
  await click(count===1?0:count===5?1:2);
  for(let round=1;round<=count;round++){
    expect(elements[0].playbackRate).toBe(1);
    await act(async()=>{elements[0].dispatchEvent(new Event('ended'));});
    if(round<count){await act(async()=>vi.advanceTimersByTime(999));expect(elements[0].play).toHaveBeenCalledTimes(round);await act(async()=>vi.advanceTimersByTime(1));}
  }
  await act(async()=>vi.advanceTimersByTime(2000));expect(elements[0].play).toHaveBeenCalledTimes(count);expect(host.textContent).toContain('idle');expect(fetch).toHaveBeenCalledTimes(1);
});
it.each(['stop','page','hide'])('cancels pending repeats on %s',async action=>{
  vi.useFakeTimers();await act(async()=>root.render(<Reader/>));await click(1);
  await act(async()=>{elements[0].dispatchEvent(new Event('ended'));});
  if(action==='stop')await click(1);else if(action==='page')await act(async()=>root.render(<Reader page="beginner-02-01"/>));else await act(async()=>window.dispatchEvent(new Event('pagehide')));
  await act(async()=>vi.advanceTimersByTime(2000));expect(elements[0].play).toHaveBeenCalledTimes(1);expect(elements[0].hasAttribute('src')).toBe(false);
});
it('shows only listening buttons, opens 5/10 modal after the ad finishes',async()=>{
  let finish:(()=>void)|undefined;ads.show.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
  await act(async()=>root.render(<PictureBookAudio id={id} text={text}/>));
  expect(host.textContent).not.toMatch(/0.7|계속 반복|3회/);expect(host.textContent).toContain('연속듣기');
  await click(1);expect(host.querySelector('dialog')).toBeNull();
  await act(async()=>finish?.());expect(host.querySelector('dialog')).not.toBeNull();expect(host.textContent).toContain('5회 듣기');expect(host.textContent).toContain('10회 듣기');
});
it('does not open a late ad dialog on a different page',async()=>{
  let finish:(()=>void)|undefined;ads.show.mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;}));
  await act(async()=>root.render(<PictureBookAudio id={id} text={text}/>));await click(1);
  await act(async()=>root.render(<p>Other page</p>));await act(async()=>finish?.());expect(host.querySelector('dialog')).toBeNull();
});
it('shows chant only for beginner pages and stops narration when switching',async()=>{
  await act(async()=>root.render(<PictureBookAudio id={id} text={text}/>));
  expect(host.textContent).toContain('챈트 듣기');
  await click(0);
  await act(async()=>{elements[0].dispatchEvent(new Event('playing'));});
  const chantButton=Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='챈트 듣기');
  expect(chantButton).toBeDefined();
  await act(async()=>{chantButton?.click();});
  expect(elements[0].pause).toHaveBeenCalled();
  expect(elements[0].hasAttribute('src')).toBe(false);
  expect(elements[1].src).toContain('/beginner-chants/');
  await act(async()=>root.render(<PictureBookAudio id="advanced-01-01" text={text}/>));
  expect(host.textContent).not.toContain('챈트 듣기');
  expect(elements[1].pause).toHaveBeenCalled();
});
it('stops a playing chant when narration starts',async()=>{
  await act(async()=>root.render(<PictureBookAudio id={id} text={text}/>));
  const chantButton=Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='챈트 듣기');
  await act(async()=>{chantButton?.click();});
  await act(async()=>{elements[0].dispatchEvent(new Event('playing'));});
  await click(0);
  expect(elements[0].pause).toHaveBeenCalled();
  expect(elements[0].hasAttribute('src')).toBe(false);
  expect(elements[1].src).toContain('/picture-book-audio/');
});
it('rejects a chant manifest whose text differs from the current page',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[{id,text:'다른 본문',sha256:hash,file:`${id}-${hash.slice(0,16)}.mp3`}]})));
  await act(async()=>root.render(<PictureBookAudio id={id} text={text}/>));
  const chantButton=Array.from(host.querySelectorAll('button')).find(button=>button.textContent==='챈트 듣기');
  await act(async()=>{chantButton?.click();});
  expect(elements).toHaveLength(0);
  expect(host.textContent).toContain('챈트를 재생하지 못했어요');
});
