# 단어장 음성 읽기

2026-10-26 사용자 결정: PWA부터 구현하고, 토스는 음성 파일 방식을 검토한다. 토스 번들·Android APK·Capacitor 동기화는 별도 요청 전 실행하지 않는다.

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
| 토스 | Android WebView의 브라우저 TTS 미지원이 확인되어 동일 코드를 적용하지 않았다. 음성 파일 방식 검토 단계. iOS 토스에서도 실제 음성·무음 모드·광고와의 충돌 검증이 필요. |
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
