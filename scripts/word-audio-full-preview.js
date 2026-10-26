const list = document.getElementById('list');
const status = document.getElementById('status');
const input = document.getElementById('search');
const more = document.getElementById('more');
let entries = [];
let visible = 20;
function stopAll() { document.querySelectorAll('audio').forEach(audio => audio.pause()); }
function render() {
  stopAll();
  list.replaceChildren();
  const query = input.value.trim().toLowerCase();
  const matches = entries.filter(entry => `${entry.word} ${entry.example}`.toLowerCase().includes(query));
  status.textContent = `${matches.length.toLocaleString('ko-KR')}개 단어`;
  for (const entry of matches.slice(0, visible)) {
    const card = document.createElement('article');
    const title = document.createElement('h2'); title.textContent = entry.word; title.lang = 'en';
    const example = document.createElement('p'); example.textContent = entry.example; example.lang = 'en';
    const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'none';
    audio.src = new URL(`word-audio/${entry.file}`, location.href).href;
    const error = document.createElement('p'); error.setAttribute('role', 'alert'); error.className = 'error';
    audio.addEventListener('error', () => { error.textContent = '음성을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'; });
    card.append(title, example, audio);
    for (const [label, rate] of [['듣기', 1], ['느리게', 0.7]]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.addEventListener('click', () => {
        audio.playbackRate = rate; audio.preservesPitch = true; error.textContent = '';
        audio.play().catch(() => { error.textContent = '재생하지 못했습니다. 다시 눌러 주세요.'; });
      });
      card.append(button);
    }
    card.append(error); list.append(card);
  }
  more.hidden = matches.length <= visible;
}
input.addEventListener('input', () => { visible = 20; render(); });
more.addEventListener('click', () => { visible += 20; render(); });
document.addEventListener('play', event => { document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); }); }, true);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
window.addEventListener('pagehide', stopAll);
fetch('./manifest.json', { cache: 'no-cache' }).then(response => {
  if (!response.ok) throw new Error('manifest');
  return response.json();
}).then(manifest => {
  if (manifest.schemaVersion !== 1 || manifest.pauseMs !== 500 || typeof manifest.entries !== 'object' || !manifest.entries) throw new Error('schema');
  entries = Object.values(manifest.entries); render();
}).catch(() => { status.textContent = '음성 목록을 불러오지 못했습니다. HTTP 서버 또는 배포 주소에서 열어 주세요.'; });
