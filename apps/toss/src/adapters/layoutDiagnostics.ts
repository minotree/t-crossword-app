import { SafeArea } from '@apps-in-toss/web-framework';
import './layoutDiagnostics.css';

// Temporary opt-in build diagnostics. Contains geometry only, never session data.
export function startLayoutDiagnostics(): void {
  document.documentElement.dataset.layoutDebug = 'true';
  const panel = document.createElement('output');
  panel.className = 'layout-diagnostics';
  panel.setAttribute('aria-label', '상하단 배치 진단');
  document.body.append(panel);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.append(probe);
  const update = () => {
    const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
    const shell = rect('.app-shell');
    const heading = rect('.app-heading');
    const tabs = rect('.bottom-navigation');
    const ad = rect('.ad-banner');
    const safe = rect('.bottom-safe-area');
    let sdk: string;
    let sdkTop: string;
    try { const insets = SafeArea.get(); sdk = String(insets.bottom); sdkTop = String(insets.top); } catch { sdk = '미지원'; sdkTop = '미지원'; }
    const px = (value: number | undefined) => value === undefined ? '-' : String(Math.round(value * 10) / 10);
    const tds = getComputedStyle(document.body).getPropertyValue('--toss-safe-area-bottom').trim();
    const shellPadding = document.querySelector('.app-shell');
    const topPadding = shellPadding ? getComputedStyle(shellPadding).paddingTop : '-';
    panel.textContent = `상하단 진단 · CSS px\n상단 SDK ${sdkTop} / env ${getComputedStyle(probe).paddingTop} / 앱 padding ${topPadding}\n앱 시작 ${px(shell?.top)} / 제목 시작 ${px(heading?.top)}\n하단 SDK ${sdk} / TDS ${tds || '-'} / env ${getComputedStyle(probe).paddingBottom}\n창 ${innerHeight} / 화면 ${screen.height} / 앱끝 ${px(shell?.bottom)}\n초록 탭 ${px(tabs?.height)} / 시작 ${px(tabs?.top)}\n노랑 광고 ${px(ad?.height)} / 시작 ${px(ad?.top)} / 끝 ${px(ad?.bottom)}\n주황 안전영역 ${px(safe?.height)} / 끝 ${px(safe?.bottom)}`;
  };
  // Observe TDS's post-mount variable and delayed SDK banner rendering too.
  const timer = window.setInterval(update, 500);
  update();
  window.addEventListener('pagehide', () => {
    clearInterval(timer);
    panel.remove();
    probe.remove();
    delete document.documentElement.dataset.layoutDebug;
  }, { once: true });
}

