import { useEffect, useState } from 'react';
import { scheduleAfterLoad } from '../adapters/scheduleAfterLoad.js';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function PwaStatus() {
  const online = useOnlineStatus();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let mounted = true;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    const changed = () => {
      if (!hadController) return;
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    const cancelRegistration = scheduleAfterLoad(() => {
      void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(registration => {
        if (mounted && registration.waiting) setWaiting(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (mounted && worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
          });
        });
      }).catch(() => { if (mounted) setError('오프라인 사용 준비에 실패했습니다. 인터넷 연결 후 다시 실행해 주세요.'); });
    });
    return () => { mounted = false; cancelRegistration(); navigator.serviceWorker.removeEventListener('controllerchange', changed); };
  }, []);
  return <>
    {!online && <p role="status" className="bg-amber-50 p-2 text-center text-sm">오프라인입니다. 퍼즐과 단어장은 이용할 수 있습니다. 처음 여는 그림책 이미지는 인터넷 연결이 필요합니다.</p>}
    {error && <p role="alert" className="p-2 text-center text-sm text-rose-700">{error}</p>}
    {waiting && <div className="bg-blue-50 p-2 text-center text-sm">새 버전이 준비됐습니다. 업데이트하면 현재 퍼즐은 새로 시작됩니다. <button type="button" onClick={() => waiting.postMessage('SKIP_WAITING')} className="font-bold text-blue-700 underline">업데이트</button></div>}
  </>;
}
