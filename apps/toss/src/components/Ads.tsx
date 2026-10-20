import { useEffect, useRef, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd, TossAds } from '@apps-in-toss/web-framework';
import { Button } from '@toss/tds-mobile';
import { HintGatewayError, type HintGateway } from '../adapters/hintGateway.js';
import { isTossEnvironment, subscribeBack } from '../adapters/platform.js';
import { Modal } from './Modal.js';

export const TEST_REWARDED_ID = 'ait-ad-test-rewarded-id';
export const TEST_BANNER_ID = 'ait-ad-test-banner-id';
let bannerInitialization: Promise<void> | null = null;
function initializeBanner() {
  if (!bannerInitialization) {
    bannerInitialization = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('banner_timeout')), 20_000);
      TossAds.initialize({ callbacks: {
        onInitialized: () => { window.clearTimeout(timer); resolve(); },
        onInitializationFailed: () => { window.clearTimeout(timer); reject(new Error('banner_failed')); },
      } });
    }).catch((error: unknown) => { bannerInitialization = null; throw error; });
  }
  return bannerInitialization;
}

export function AdBanner({ enabled }: { enabled: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || failed || !isTossEnvironment()) return;
    let active = true;
    let attached: ReturnType<typeof TossAds.attachBanner> | undefined;
    try {
      if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) { setFailed(true); return; }
      void initializeBanner().then(() => {
        if (!active || !container.current) return;
        attached = TossAds.attachBanner(TEST_BANNER_ID, container.current, {
          theme: 'auto', tone: 'blackAndWhite', variant: 'expanded',
          callbacks: { onAdFailedToRender: () => { if (active) setFailed(true); }, onNoFill: () => { if (active) setFailed(true); } },
        });
      }).catch(() => { if (active) setFailed(true); });
    } catch { setFailed(true); }
    return () => { active = false; attached?.destroy(); };
  }, [enabled, failed]);
  if (!enabled || failed || !isTossEnvironment()) return null;
  return <aside className="ad-banner" aria-label="광고"><div ref={container} /></aside>;
}

export function RewardedAd({ open, gateway, onBalance, onClose }: {
  open: boolean; gateway: HintGateway | null; onBalance: (balance: number) => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'showing' | 'claiming' | 'pending' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [availableAt, setAvailableAt] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const pendingReward = useRef<string | null>(null);
  const preparing = useRef<string | null>(null);
  const busy = useRef(false);
  const unsubscribe = useRef<(() => void) | undefined>(undefined);
  const showTimer = useRef<number | undefined>(undefined);
  const alive = useRef(true);
  useEffect(() => {
    if (!open || !availableAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (!remaining) {
        setAvailableAt(0);
        if (!busy.current && !pendingReward.current) setAttempt(value => value + 1);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [open, availableAt]);
  useEffect(() => {
    if (!open || status === 'showing') return;
    return subscribeBack(() => { if (!busy.current) onClose(); }, () => setMessage('화면의 닫기 버튼을 이용해 주세요.'));
  }, [open, onClose, status]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; unsubscribe.current?.(); window.clearTimeout(showTimer.current); };
  }, []);
  useEffect(() => {
    if (!open || pendingReward.current || busy.current) return;
    if (availableAt > Date.now()) {
      setStatus('ready'); setMessage('다음 광고 보상까지 잠시 기다려 주세요.');
      return;
    }
    setStatus('loading'); setMessage('');
    let active = true;
    const fail = () => { if (active) { setStatus('error'); setMessage('광고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'); } };
    const timer = window.setTimeout(fail, 20_000);
    let cleanup: (() => void) | undefined;
    try {
      if (!isTossEnvironment() || !loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
        setStatus('error'); setMessage('광고는 지원되는 토스 앱에서 이용할 수 있습니다.');
      } else {
        cleanup = loadFullScreenAd({ options: { adGroupId: TEST_REWARDED_ID },
          onEvent: (event) => { if (active && event.type === 'loaded') { window.clearTimeout(timer); setStatus('ready'); } },
          onError: () => { window.clearTimeout(timer); fail(); },
        });
      }
    } catch { fail(); }
    return () => { active = false; window.clearTimeout(timer); cleanup?.(); };
  }, [open, attempt, availableAt]);

  const claim = async () => {
    const requestId = pendingReward.current;
    if (!requestId || !gateway?.claimTestAd || busy.current) return;
    busy.current = true; setStatus('claiming'); setMessage('힌트 5개를 지급하고 있습니다.');
    try {
      const balance = await gateway.claimTestAd(requestId);
      pendingReward.current = null; preparing.current = null;
      if (alive.current) { onBalance(balance); setStatus('done'); setMessage('힌트 5개가 추가되었습니다.'); }
    } catch (error) {
      const expired = error instanceof HintGatewayError && ['ad_reward_expired', 'ad_reward_unavailable'].includes(error.code);
      if (expired) { pendingReward.current = null; preparing.current = null; }
      if (alive.current) { setStatus(expired ? 'error' : 'pending'); setMessage(error instanceof Error ? error.message : '보상을 받지 못했습니다. 다시 시도해 주세요.'); }
    } finally { busy.current = false; }
  };
  const show = async () => {
    if (busy.current || status !== 'ready' || !gateway?.prepareTestAd || !gateway.claimTestAd) return;
    busy.current = true; setStatus('showing'); setMessage('');
    const requestId = preparing.current ?? crypto.randomUUID();
    preparing.current = requestId;
    try {
      await gateway.prepareTestAd(requestId);
      setAvailableAt(Date.now() + 60_000);
      setRemainingSeconds(60);
      if (!alive.current) return;
      let earned = false;
      let finished = false;
      const finish = (failed = false) => {
        if (finished) return;
        window.clearTimeout(showTimer.current);
        finished = true; busy.current = false;
        if (!alive.current) return;
        if (earned) { pendingReward.current = requestId; void claim(); }
        else { preparing.current = null; setStatus('error'); setMessage(failed ? '광고를 표시하지 못했습니다. 다시 시도해 주세요.' : '시청 완료가 확인되지 않아 보상을 지급하지 않았습니다.'); }
      };
      unsubscribe.current?.();
      showTimer.current = window.setTimeout(() => finish(true), 120_000);
      unsubscribe.current = showFullScreenAd({ options: { adGroupId: TEST_REWARDED_ID },
        onEvent: (event) => {
          if (finished) return;
          if (event.type === 'userEarnedReward') earned = true;
          if (event.type === 'dismissed') finish();
          if (event.type === 'failedToShow') finish(true);
        }, onError: () => finish(true),
      });
    } catch (error) {
      window.clearTimeout(showTimer.current);
      if (error instanceof HintGatewayError && error.code === 'ad_reward_expired') preparing.current = null;
      if (error instanceof HintGatewayError && error.code === 'ad_reward_limit') {
        setAvailableAt(Date.now() + 60_000);
        setRemainingSeconds(60);
      }
      busy.current = false;
      if (alive.current) { setStatus('error'); setMessage(error instanceof Error ? error.message : '광고를 시작하지 못했습니다.'); }
    }
  };
  if (!open) return null;
  return <Modal title="광고 보고 힌트 받기" onClose={() => { if (!busy.current) onClose(); }}>
    <p>광고 시청을 완료하면 힌트 5개를 드려요.</p>
    <p className="secondary">시청하지 않아도 퍼즐과 그림책을 이용할 수 있어요.</p>
    <p className="secondary">보상은 1분에 한 번, 24시간 동안 최대 10번 받을 수 있어요.</p>
    {message && <p role="status" className="secondary">{message}</p>}
    <div className="reading-actions">
      {status === 'pending' ? <Button onClick={() => { void claim(); }}>보상 다시 받기</Button>
        : remainingSeconds > 0 && status !== 'showing' && status !== 'claiming' && status !== 'done'
          ? <Button disabled>{remainingSeconds}초 후 다시 이용 가능</Button>
        : status === 'error' ? <Button onClick={() => setAttempt(value => value + 1)}>다시 준비하기</Button>
        : status === 'done' ? <Button onClick={onClose}>확인</Button>
        : <Button disabled={status !== 'ready' || !gateway?.prepareTestAd} loading={status === 'loading' || status === 'showing' || status === 'claiming'} onClick={() => { void show(); }}>
          {status === 'loading' ? '광고 준비 중' : status === 'claiming' ? '보상 확인 중' : '광고 보고 힌트 5개 받기'}
        </Button>}
    </div>
  </Modal>;
}
