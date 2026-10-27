# 단어장 음성 읽기

## 공개 manifest 공유 연결 (2026-10-27)

Web/PWA·토스·모바일 소스는 모두 `https://crossword-word-audio.minotree0902.workers.dev/manifest.json`을 첫 듣기 요청에서 가져와 재사용한다. 웹의 브라우저 TTS는 이 MP3 방식으로 교체했다. 아래 브라우저 TTS 및 로컬 ID 기반 연결 설명은 이전 구현 이력이다.

공통 core 경계 검사는 schemaVersion 1·500ms 쉼·`word-audio/`·단어 키·해시 포함 파일명·길이를 검증한다. 앱 ID는 재생 상태에만 사용하고 음성은 대문자 영단어와 정확히 같은 예문으로 찾는다. 파일명은 manifest 값을 그대로 사용한다. 누락·예문 불일치·목록/MP3 로딩 실패는 듣기 버튼을 누른 카드에 안내한다. 실패한 목록 요청은 재시도할 수 있다.

각 앱은 재생 UI와 미디어 어댑터를 독립 소유한다. 클릭 재생·일반/0.7배속·이전 음성 중지·화면 이탈 정리·늦은 비동기 응답 방어·로딩/오류 접근성 상태를 제공한다. MP3 전체 다운로드·precache·브라우저 TTS 대체 실행은 하지 않는다. 원격 음성은 인터넷 연결이 필요하며 오프라인 재생을 보장하지 않는다.

공개 목록 HTTP 200과 현재 CSV의 바이트 SHA-256 일치를 확인했다. 3,839개 모두 누락·추가·예문 불일치가 없다. 재검사는 공개 manifest를 파일로 내려받은 후 `python scripts/check-shared-word-audio.py <manifest.json 경로>`로 실행한다. MP3 전수 청취·실제 브라우저/설치 PWA/토스/Android/iOS의 재생·무음 모드·앱 전환·오디오 포커스는 별도 검증 대상이다. 이번 작업에서는 Cloudflare 변경·음성 생성·배포·APK/ait 생성·Capacitor sync를 실행하지 않았다.

## 전체 3,839개 음성 준비 이력 (2026-10-26)

사용자가 선택한 **0.5초 삽입 쉼**으로 전체 단어·예문 음성을 생성했다. 전체 CSV/JSON 대응·MP3 해시/디코딩·무음 구간·발음 기호 누락 검사를 통과하고 토스 manifest 3,839개를 갱신했다. 모델 자체의 앞뒤 무음은 추가로 남을 수 있다. 일반 재생 1.0배속, 느리게 0.7배속이며 느린 재생의 삽입 쉼은 약 0.714초다.

Cloudflare 업로드 파일은 `artifacts/toss-word-audio-full.zip`(117,485,166 bytes)이다. 이전 v1/v2 파일 20개를 포함해 기존 URL을 보존한다. 전체 음성은 토스 번들에 넣지 않고 기존 Cloudflare 주소에서 클릭할 때 불러온다. **전체 ZIP을 Cloudflare에 먼저 업로드한 후 토스 번들을 생성·업로드한다.** 이번에는 Cloudflare 배포·`.ait`·APK 생성을 실행하지 않았다. 새 음성이 업로드되기 전 새 토스 소스의 URL은 아직 존재하지 않는다.

다른 앱은 전체 업로드 후 `https://crossword-word-audio.minotree0902.workers.dev/manifest.json`에서 대문자 영단어와 정확히 같은 예문으로 음성을 찾을 수 있다. BOM CSV 주소표는 `artifacts/toss-word-audio-full/word-audio-links.csv`다. 자세한 재현·업로드·연결 안내는 [전체 제작 안내](../content/word-audio/FULL.md), 실제 수치와 검사 결과는 `content/word-audio/full-validation.json`을 따른다.

토스 테스트 90개·lint·타입 검사를 포함한 일반 빌드 통과. 기존 큰 청크 경고는 남아 있다. 사용자의 v2 표본 청취 확인과 v3 전체 전수 청취는 구분한다. v3 전체 발음·자연스러움에 대한 사람 검수, 전체 Cloudflare 업로드 후 원격 검사, 실제 토스 iPhone/Android의 재생·광고/전화 오디오 포커스 검증은 대기다. PWA는 기존 브라우저 TTS를 유지하고 Android 모바일 앱 소스는 이번에 변경하지 않았다.

## 이전 표본 구현·검토 이력

아래의 “대기”, “10개”, “미설정”은 당시 시점의 기록이다. 최신 상태는 위 전체 버전 안내를 따른다.

v2 후속: 사용자가 Cloudflare 갱신을 완료했다. v2 페이지·새 음성 10개·기존 v1 음성 10개 모두 원본 해시·정상 HTTP 응답·오디오 MIME·CORS 확인 완료(`content/word-audio/remote-validation.json`). 토스 소스는 이미 v2를 참조하며 사용자 번들 재생성/업로드·실제 기기 간격 확인은 대기다. 아래 v2 업로드 대기는 이 확인 전 기록이다.

최신 표본은 v2다. 사용자 간격 피드백으로 단어/예문을 따로 합성하고 사이에 0.8초 무음을 삽입했다. `artifacts/toss-word-audio-preview-v2/public/index.html`에서 청취하고 `artifacts/toss-word-audio-preview-v2.zip`으로 Cloudflare를 먼저 갱신한 뒤 토스 번들을 재생성한다. ZIP에는 이전 토스 URL 보존용 v1 파일 10개도 포함한다. 디코딩/해시/삽입 무음 검사·토스 일반 빌드 통과. v2 청취·Cloudflare 업로드·기기 검증은 대기다. 아래 v1 경로·용량·청취 기록과 구분한다.

2026-10-26 사용자 결정: PWA부터 구현하고, 토스는 음성 파일 방식을 검토한다. 토스 번들·Android APK·Capacitor 동기화는 별도 요청 전 실행하지 않는다.

## 토스 표본 10개 구현 (2026-10-26 후속)

- 후속: 사용자가 로컬 표본을 듣고 잘 들린다고 확인했다(개별 단어별 발음 감사와 구분). Cloudflare 업로드도 사용자가 완료했다. `https://crossword-word-audio.minotree0902.workers.dev/word-audio/`를 토스 `.env.production`에 연결했다. curl로 페이지 200, MP3 10개 모두 200·원본 SHA-256 일치·audio/mpeg·CORS `*`·immutable 캐시를 확인했다(`content/word-audio/remote-validation.json`). Range 요청에는 206 대신 전체 파일 200이 반환돼 부분 응답 지원으로 기록하지 않는다. urllib 검사는 403이었으며 실제 성공한 검사는 curl이다. 일반 빌드의 공개 주소 포함도 확인했다. 아래 주소 미설정 기록은 연결 전 이력이며 토스 기기 재생은 아직 대기다.
- 사용자와 무료 상업용 호스팅 조건을 검토한 후 **Cloudflare Workers Static Assets**를 선택했다. Vercel Hobby의 비상업 용도 제한 때문에 Vercel/PWA 파일 업로드 계획은 철회했다. R2 종량제·유료 요금제는 사용하지 않는다. Cloudflare 가입과 Workers & Pages 화면 열기는 사용자가 완료했다.
- 로컬 CPU에서 Kokoro 0.9.4 / Kokoro-82M v1.0 / `af_heart`로 단어+예문 10개를 24kHz mono·64kbps MP3로 생성했다. 344,640 bytes, 평균 34,464 bytes이며 전체 3,839개 추정은 약 132.3MB다. 실제 전체 용량과 다를 수 있다.
- `content/word-audio/`에 원본 모델 카드·음성 목록·라이선스 전문·모델/음성 리비전/해시·텍스트·생성 환경·검사 기록을 보존한다. MP3 10개 디코딩·비무음·길이·해시·단어장/manifest 대응 통과. 발음·자연스러움에 대한 사람 청취 검수는 대기다.
- 토스 전용 `wordAudio.ts`와 `WordAudioButtons.tsx`로 클릭 재생·일반/0.7배속·pitch 보존 요청·중지·단어/속도 교체·오류·15초 시작/버퍼 대기 한도·이전 재생의 늦은 이벤트 방어를 구현했다. 검색·분류·메뉴 이동·문서 숨김·pagehide·앱 컴포넌트 해제 시 중지한다. 브라우저 pause 이벤트도 상태에 반영한다.
- 최초 재생 전 파일을 요청하지 않는다. 단어 ID뿐 아니라 현재 표제어와 예문이 manifest와 일치해야 표시한다. 실제 MP3 바이트 해시를 URL에 넣어 새 음성이 이전 캐시와 섞이지 않게 한다.
- `VITE_TOSS_WORD_AUDIO_BASE_URL`에 공개 HTTPS의 `/word-audio/` 경로를 설정한다. localhost HTTP는 로컬 확인용으로만 허용한다. 주소 미설정 시 버튼을 숨긴다. 현재 실제 배포 주소는 미설정이며 샘플 10개만 등록돼 있다.
- 유효한 미리보기/업로드 폴더는 `artifacts/toss-word-audio-preview/public/`, ZIP은 `artifacts/toss-word-audio-preview.zip`이다. `index.html`을 직접 열거나 로컬 HTTP 서버로 청취한다. 재현·업로드 순서는 [제작 README](../content/word-audio/README.md)를 따른다.
- 토스 테스트 89개·lint·타입 검사를 포함한 일반 빌드 통과. 실제 브라우저 청취·Cloudflare HTTPS 재생·토스 Android/iOS·무음 모드·기기 음량·전화/음악/광고와의 포커스 검증은 대기다. 브라우저 pause/visibility 처리만으로 모든 네이티브 포커스 전환을 검증했다고 하지 않는다.
- 앱 런타임 의존성·PWA 음성 방식·Android 소스는 변경하지 않았다. Python 모델·도구는 로컬 제작에만 사용하고 토스 번들에 포함하지 않는다. 무료 정적 전송은 Worker 스크립트·AI 추론·R2를 호출하지 않는 구성에 한정한다. [Cloudflare 요금](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) 및 [Developer Platform 조건](https://www.cloudflare.com/service-specific-terms-developer-platform/) 확인.
- 사용자 청취 후 표본 채택·Cloudflare 업로드·실제 주소 설정·토스 기기 확인을 거쳐 전체 생성을 진행한다. 공개 배포·`.ait`·APK·Capacitor sync·커밋·푸시는 하지 않았다. 아래 초기 검토 항목의 ‘미실행’은 이번 구현 전 상태다.

## PWA 구현

- 각 단어 카드의 `듣기`와 `느리게`는 영어 표제어와 영어 예문만 읽는다. 한국어 뜻·해석·동의어는 읽지 않는다.
- 브라우저 `speechSynthesis`를 사용하는 웹 전용 어댑터다. 언어는 `en-US`, 속도는 일반 1.0·느림 0.7이다. 사용 가능한 미국 영어 음성을 우선하고 없으면 다른 영어 음성, 음성 목록이 아직 비어 있으면 `en-US` 언어 요청을 사용한다.
- 같은 속도의 버튼을 다시 누르면 중지한다. 다른 단어·속도를 누르면 기존 재생을 취소하고 새 내용을 읽는다.
- 검색·분류 변경, 단어장 화면 이탈, 페이지 숨김·이탈 시 취소한다. 이전 발화의 늦은 이벤트가 새 재생 상태를 덮어쓰지 않게 구분한다.
- 미지원, 영어 음성 없음, 재생 오류, 8초 내 시작 이벤트가 없는 경우 해당 카드에 오류를 안내한다. 미지원 환경에서 재생 중이라고 표시하지 않는다.
- 버튼은 키보드로 조작 가능하며 재생 중 상태와 중지 동작을 접근성 이름·`aria-pressed`로 제공한다.
- API 키·유료 TTS 서버·음성 파일·새 의존성을 추가하지 않았다. 기기/브라우저 음성은 네트워크를 사용할 수 있어 오프라인 발음을 보장하지 않는다. 음성 품질·엔진 동작은 실제 기기에서 확인해야 한다.

관련 코드: `apps/web/src/adapters/wordSpeech.ts`, `apps/web/src/components/WordSpeechButtons.tsx`, `apps/web/src/pages/WordBankPage.tsx`.

## 플랫폼별 확인 범위

| 플랫폼 | 방식과 상태 |
| --- | --- |
| Web/PWA | 브라우저 TTS 구현·자동 검사 완료. 실제 청취·설치 PWA·브라우저별 검증 미실행. |
| 토스 | 음성 파일 표본 10개·플레이어 소스·자동 검사 완료. 실제 주소 미설정·청취/기기 검수 대기. 브라우저 speechSynthesis는 사용하지 않는다. |
| Android 모바일 | Android WebView에도 동일 제한이 있다. Android `TextToSpeech`를 Capacitor 어댑터로 연결하거나 검수한 음성 파일을 재생하는 방식이 필요하다. 이번에는 네이티브 플러그인·의존성·앱 코드 변경 없음. |

근거:

- [MDN SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [MDN 공식 호환성 데이터](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechSynthesis.json): Android Chrome과 Android WebView를 구분한다.
- [토스 공식 커뮤니티의 재현·확인 답변](https://techchat-apps-in-toss.toss.im/t/speechsynthesis/4030/7)
- [Android TextToSpeech 공식 API](https://developer.android.com/reference/android/speech/tts/TextToSpeech)

## 토스 음성 파일 방식 검토

음성 파일을 사전에 만들어 버튼을 누를 때 `HTMLAudioElement`로 재생하면 브라우저 음성합성 API에 의존하지 않는다. 일반 속도 파일 하나를 `playbackRate`로 낮춰 재생하는 구성을 우선 검토한다. [MDN playbackRate](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate).

제작·구현 전 확인할 항목:

1. TTS 도구 코드·모델·선택 음성의 상업적 생성 및 생성 음원 배포 조건을 각각 확인한다. 모델 라이선스만으로 개별 음성의 이용 권한을 추정하지 않는다. 예를 들어 [Kokoro 공식 모델 카드](https://huggingface.co/hexgrad/Kokoro-82M)는 Apache-2.0 가중치를 표시하지만 이번에는 도구·음성 선정을 확정하거나 모델을 다운로드하지 않았다. Windows 설치 음성·무료 웹 발음 API를 임의로 녹음·추출해 재배포하지 않는다.
2. 권한을 확인한 도구로 우선 10개 표본의 단어·예문 음성을 만들어 발음, 끊김, 느린 재생의 음질과 실제 파일 크기를 확인한다. 생성 도구·모델/음성 버전·텍스트·날짜·설정·해시를 기록한다. 현재 음원 생성은 미실행이다.
3. 3,339개 전체 및 그림책과 합산한 토스 번들 용량을 산정한다. 단어·예문 파일 분리 여부, 번들 포함 또는 승인된 정적 호스팅을 표본 크기로 결정한다. 무료 운영 원칙을 유지하고 유료 서버를 기본 전제로 삼지 않는다. 단어 ID만으로 파일을 연결하지 않고 본문 해시도 검증해 수정된 예문에 이전 음성이 붙지 않게 한다.
4. 파일 플레이어는 사용자 클릭으로 시작하며 중복 재생·빠른 연속 선택·오류·취소를 처리한다. 화면 숨김·메뉴 이동·광고 표시 시 중지하고 지원되는 SDK 오디오 포커스 처리를 확인한다. 원격 파일은 최초 재생에 네트워크가 필요하며 오프라인 범위를 명확히 한다.
5. 실제 토스 Android/iOS에서 재생·느린 재생·광고·전화/음악 오디오 포커스·무음 모드·기기 음량·백그라운드 중지를 검증한다. `.ait` 빌드만으로 실행 가능하다고 확정하지 않는다.

현재 결론: PWA는 먼저 사용해 보고, 토스는 권리·품질·용량 확인 후 파일 플레이어로 확장한다. Android는 네이티브 TTS와 동일 파일 재사용 중 운영 방식에 맞게 결정한다.
