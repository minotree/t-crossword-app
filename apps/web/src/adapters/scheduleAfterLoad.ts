/** Start background preparation after page load, with a short idle deadline. */
export function scheduleAfterLoad(task: () => void): () => void {
  let timer: number | undefined;
  let idle: number | undefined;
  let canceled = false;
  const run = () => { if (!canceled) task(); };
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      idle = window.requestIdleCallback(run, { timeout: 3000 });
    } else {
      timer = globalThis.setTimeout(run, 1000);
    }
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    canceled = true;
    window.removeEventListener('load', schedule);
    if (idle !== undefined) window.cancelIdleCallback(idle);
    if (timer !== undefined) globalThis.clearTimeout(timer);
  };
}
