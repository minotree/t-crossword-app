# 영어 낱말 · Android / Ionic

## 긴 정답 설명 스크롤·하단 버튼 유지 (2026-10-28)

토스와 같은 사용 흐름으로 뜻·동의어·예문만 별도 문제 설명 영역에서 스크롤하고 제목·입력칸·힌트/정답입력/닫기를 유지한다. 긴 설명을 생략하지 않는다. 기존 visualViewport 위치/높이 처리를 사용하고 극도로 낮은 화면에서는 dialog 자체 스크롤도 허용한다. 320px에서도 버튼 글자가 한 줄로 유지되도록 Ionic 버튼 여백과 최소 44px 높이를 조정했다.

모바일 Node 테스트 30개·React/음성 통합 검사 19개·build(타입 포함)·Android sync·JDK 21 assembleDebug 통과. 실제 Ionic 렌더링을 Headless Chrome에서 폭 390/320/844px·가용 높이 380/280/270px로 모사해 설명 스크롤 전후 버튼 좌표와 화면을 확인했다. ../../docs/verification/20261028-web-mobile-answer-layout.json 참고. 실제 Android/iOS 키보드·기기 조작은 미실행이다.

최신 APK: android/app/build/outputs/apk/debug/app-debug.apk, 34,850,410 bytes, SHA-256 D76E6686A7F48939CB896EC348712DAEB66863E72453433281C03FD4DEF8FDBB. APK/dist 자산 131개 해시 일치. Git 작업과 토스 빌드·업로드는 사용자가 직접 진행한다.

## 단어·예문 음성 듣기 (2026-10-27 최신)

- 단어장의 각 카드에 듣기·느리게(0.7배속)·중지를 제공한다. 토스에서 사용하던 Cloudflare 공개 MP3 3,839개를 재사용하며 단어+예문 사이 삽입 쉼은 0.5초다. 모델 자체의 앞뒤 무음은 별도로 남을 수 있고 느리게 재생하면 삽입 쉼도 길어진다. 새 음성을 생성하지 않았다.
- MP3는 버튼을 누를 때 HTTPS로 재생한다. APK에 MP3·모델을 넣지 않으며 음성에는 인터넷이 필요하다. 오프라인 다운로드·백그라운드 재생·브라우저 TTS는 추가하지 않았다.
- 별도 환경 설정 없이 기존 공개 주소를 기본 사용한다. 필요하면 앱의 환경변수 VITE_MOBILE_WORD_AUDIO_BASE_URL로 공개 음성 디렉터리를 변경한다. 명시적 빈 값은 버튼을 숨긴다. .env.example은 자리표시자이며 기존 Supabase 힌트 변수는 구버전 이력이다.
- src/adapters/wordAudio.ts가 모바일 HTML media 상태를 관리한다. 동시에 하나만 재생하고 재선택·속도/단어 변경 시 이전 음성을 중지한다. 로딩·재생 실패·15초 지연을 안내하고 재시도할 수 있다. src/adapters/wordAudioLifecycle.ts는 visibilitychange/pagehide와 기존 Capacitor App의 appStateChange로 중지·리스너 정리를 처리하며 자동 재개하지 않는다. 검색·필터·메뉴 이동에도 중지한다. 새 네이티브 플러그인·권한은 추가하지 않았다.
- pnpm run prepare:audio는 content/word-audio/full-manifest.json과 제작 보고서·현재 vocab 해시·표제어·예문·바이트 해시 파일명·0.5초 설정을 검사해 src/data/word-audio.json을 준비한다. dev/typecheck/build에서 실행한다. 앱 간 UI·소스 import는 없고 생성 도구는 런타임에 포함하지 않는다.
- 제작·권리 검토 이력은 ../../content/word-audio/README.md 및 FULL.md를 따른다. 기존 생성물 재사용이며 이번에 라이선스 재확인·사람 전수 청취·발음 품질 전수검사를 수행하지 않았다.
- 원격 검사: 루트에서 `node scripts/check-mobile-word-audio-remote.mjs`. 공개 manifest 3,839개 전체 대응·대표 MP3 4개 해시/HTTP/MIME/CORS/캐시 검사 통과. 결과는 content/word-audio/mobile-remote-validation.json에 기록했다. https://localhost Origin 요청을 검사했으며 실제 WebView 재생 검증과 구분한다.
- 자동 검사: 모바일 test 30개·build(타입 포함), apps/mobile에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/letterHints.test.tsx tests/wordAudio.test.ts tests/wordAudioLifecycle.test.ts tests/wordAudioManifest.test.ts` 18개 통과. Ionic·Audio·네이티브 이벤트를 모사한 검사이며 기기 검증을 대신하지 않는다.
- Android sync·JDK 21 assembleDebug 통과. 최신 APK는 android/app/build/outputs/apk/debug/app-debug.apk (34,861,997 bytes), SHA-256 1C89E09D1840507347BA922AB64FC2F19155B94C9E8F2E19859084B52D614162. dist 자산 131개가 APK와 일치하고 음원·모델이 미포함임을 확인했다.
- 실제 Android의 일반/느리게 재생·출력 음량·무음/블루투스·전화/음악/광고 오디오 포커스·앱 전환·네트워크 실패 확인은 미실행이다. iOS 네이티브 프로젝트도 아직 없다.

## 토스 기준 무료 글자 힌트 적용 (2026-10-27 최신)

- 정답 입력창 하단을 `힌트 N회` → `정답입력` → `닫기` 순서로 구성했다. Ionic UI·Android 뒤로가기 등 플랫폼 연동은 모바일 앱이 소유한다.
- 모달 생성 시 현재 빈칸 수의 절반을 내림해 횟수를 만든다. 닫았다 다시 열면 현재 빈칸으로 재계산하며 이전 사용 횟수는 추가 차감하지 않는다. 공통 core의 getModalHintLimit/firstIncorrectLetterIndex를 사용한다.
- 앞에서부터 정답이 아닌 첫 칸을 공개하고 오답 표시는 해당 칸만 해제한다. 공개 글자는 읽기 전용으로 유지하며 다음 수정 가능한 칸으로 이동한다. 보드·교차 문제·모달 재열기·홈 왕복에 반영하고 새 퍼즐·학습 초기화 시 초기화한다. 2초 미리보기는 적용하지 않는다.
- 힌트 사용 즉시 오답노트에 중복 없이 등록하고 숨긴 항목은 복귀시킨다. 학습완료·즐겨찾기를 유지하고 힌트로 완성해도 학습완료한다. 최신 진행 기록 참조를 사용해 힌트와 정답 완료가 같은 클릭에서 일어나도 오답노트 등록을 보존한다.
- 모바일 저장 실패 시 공개·횟수 차감 없이 오류를 표시하고 재시도를 허용한다. 잔액·충전·보상·판 등록·힌트 인증 API는 복원하지 않는다. 아래 과거 서버 힌트 연결·운영 설정 설명은 현재 앱의 필수 작업이 아니다.
- 모바일 typecheck·Node 테스트 30개·React 상태 통합 테스트 7개·웹 빌드·Android sync·JDK 21 assembleDebug 통과. 최신 APK: `android/app/build/outputs/apk/debug/app-debug.apk` (34,850,410 bytes). APK 내 웹 자산 131개가 dist와 SHA-256 일치한다. 실제 설치·키보드·뒤로가기·화면 가독성 확인은 미실행이다.
- Node 검사는 루트에서 `pnpm.cmd --filter @t-crossword/mobile test`. React 통합 검사는 기존 설치 환경의 apps/mobile에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/letterHints.test.tsx`로 실행했다. Ionic 컴포넌트와 Worker/뷰포트 API를 모사한 상태 검사이며 실제 Ionic 렌더링·네이티브 검증을 대신하지 않는다. 새 의존성은 추가하지 않았다.
- 해당 힌트 수정에서는 iOS 프로젝트·광고 SDK·토스 정적 MP3 음성 연결을 포함하지 않았다. 이후 모바일 MP3 연결은 위 최신 음성 항목을 따른다. 모바일 고유 광고 가상 영역과 기존 기능은 유지한다.

2026-10-26: 특급 학술·심화 500개를 추가해 퀴즈는 4단계·전체 단어는 3,839개다. 특급 선택·단어장 표시·선택 수준 학습 집계·설정 설명과 WordNet 전문 고지를 모바일 소스에 반영했다. 그림책은 3단계를 유지한다. 일반 웹 빌드 검증과 Capacitor sync·APK·실제 Android/iOS 검증은 별개이며 이번에는 sync·APK를 생성하지 않았다.

2026-10-25 PWA 퀴즈 흐름 반영: 모바일 소유 `QuizPanel`·`PuzzleBoard`·방향 선택/완성 `Modal`로 보드를 가로 너비에 맞추고 아래 `문제 전체 보기`로 보드 위에 2열 목록을 연다. 제목·진행은 고정하고 목록만 함께 스크롤한다. 번호는 미완료 방향만 입력 대상으로 삼으며 모두 완료하면 클릭할 수 없다. 진행/새 퍼즐은 오른쪽 정렬한다. 완성 모달에는 복습·다음 퍼즐·하단 발사 색종이 효과를 제공하며 동작 줄이기 설정을 따른다. Android 뒤로가기는 선택창/목록/완성창을 먼저 닫는다. 실제 Android/iOS 조작·키보드·작은 화면 검증은 별도다.

2026-10-25 변경: 글자 공개·잔액·완성 보상과 힌트 서버 연결을 실행 경로에서 제거했다. 공통 Worker 출제·기기 정답 확인·학습 기록·기존 오답노트·문제의 뜻 목록은 유지한다. 힌트용 운영 설정은 새 앱 실행에 필요하지 않다. 기존 adapter·인증 코드와 아래 힌트 연결 설명은 변경 전 이력이며 운영 DB는 변경하지 않았다. 최신 웹 빌드·Android sync와 실제 APK/기기 검증은 구분한다.

2026-10-23 기준. Android 기반과 모바일 홈·퀴즈·단어장·그림책, 오답노트 숨김 삭제·재등록, Android 뒤로가기를 구현했다. 모바일 전용 Ionic UI에서 `@t-crossword/core` 공개 API를 사용한다. 비회원 인증·서버 힌트 연결 코드는 추가했으며 운영 설정/신규 API 배포와 기기 통합 검증은 대기다. 광고는 가상 영역만 있다. [힌트 적용 절차·보안 경계](../../docs/mobile-hints.md)를 따른다.

## 구현 범위

- 오답노트에서 단어별 삭제는 목록 숨김으로 저장한다. 힌트 이력·즐겨찾기·학습완료는 보존하고 동일 단어의 힌트를 다시 받으면 목록에 복귀한다. 기존 기록 호환·저장 실패 시 원래 목록 보존을 테스트했다. 실제 서버 연결 및 Android 조작 검증은 대기다.

- 모든 화면의 하단 메뉴 아래에 비클릭 가상 광고 영역 96px를 예약했다. SDK/광고 요청/수익·보상은 연결하지 않는다. 이 높이는 UI 설계용이며 실제 Android/iOS 광고 SDK의 표준 크기로 확정한 값이 아니다. 향후 연동 시 실제 크기·no-fill·키보드·Safe Area를 검증하고 자리 표시를 교체한다. 현재 빌드에는 가상 영역이 포함되므로 스토어 출시 전 처리해야 한다.

- 홈·퀴즈 풀기·단어장·설정의 하단 메뉴와 홈 복귀. 화면 전환은 모바일 화면 상태로 관리한다. 앱을 켜 둔 동안 진행 중 판을 유지하며 종료 후 판 복원은 없다.
- 공통 엔진의 기기 Worker 출제, 초·중·고급과 8/10/12 크기 선택, 가로/세로 힌트·보드·정답 입력·완성 표시. 완료 단어는 다음 판 출제에서 제외한다. Worker 오류·30초 제한 시 재시도할 수 있다.
- 가로·세로 힌트는 각각 번호 오름차순이며 완료 후에도 순서를 유지한다. 보드는 행·열을 판 크기별 `minmax(0, 1fr)`로 지정해 정답 글자의 최소 콘텐츠 크기로 셀이 늘어나는 것을 방지했다. 8/10/12 크기·작은 화면·가로 화면의 최종 가독성은 기기 확인이 필요하다.
- 단어/뜻 검색, 100개 단위 더 보기, 즐겨찾기 필터·저장, 학습 완료 표시.
- 그림책 61편/119장: 초·중·고급 목록, 목록 스크롤 위치 복원, 페이지별 해석, 이미지 로딩·실패·재시도, 영어 본문 스크린리더 텍스트와 AI 창작 안내. 여러 장짜리만 이미지 양옆에 반투명 화살표를 표시하며 첫 장의 이전·마지막 장의 다음은 숨긴다. 한 장짜리에는 페이지 이동 버튼이 없다. 이미지 아래 같은 줄 왼쪽에 해석 보기, 오른쪽 끝에 목록으로를 테두리 버튼으로 표시하고 해석은 그 아래에 펼친다. 다른 탭으로 이동했다 돌아오면 읽기 상태를 유지한다. 앱 종료 후 읽기 위치 복원은 없다.
- `src/adapters/progress.ts`를 통해 모바일 WebView localStorage의 전용 namespace에 완료/즐겨찾기·힌트 이력·오답노트 숨김을 저장한다. 손상 데이터는 덮어쓰지 않고 읽기 오류를 표시하며 저장 실패 시 변경 성공으로 처리하지 않는다. OS의 WebView 데이터 정리·앱 데이터 삭제·재설치에 따른 영속성은 보장하지 않는다. 네이티브 Preferences 등 영속 저장 정책은 후속 검토한다.
- 홈은 WORDS 그림·환영 문구·나란한 진입 버튼을 세로 중앙에 배치하고 하단 메뉴에는 플랫폼 소유 Ionicons를 사용한다. 난이도/크기 버튼, 제목 고정·목록 내부 스크롤과 가로 화면 보드/힌트 배치를 토스 흐름에 맞췄다. TDS나 토스 화면 소스는 가져오지 않는다.
- 정답 입력은 모바일 전용 `AnswerEntry.tsx`의 글자별 칸·완성 교차 글자 읽기 전용·다음 칸/방향키/백스페이스 이동·정답 자동 제출·수동 제출을 제공한다. 2026-10-25부터 오답 붉은 표시는 무제한이다. 정답 수정·삭제는 해당 칸 표시만 해제하며 한글은 오답 글자로 표시하지 않는다. 피드백 반복·교차 셀 테스트와 실제 키보드/자동 포커스/저장 실패 재시도 검증을 구분한다.
- Android 하드웨어 뒤로가기는 공식 `@capacitor/app` 7.1.2(MIT, Capacitor core >=7)와 Ionic `ionBackButton`으로 처리한다. 힌트/정답 요청 중에는 이동을 막고, 정답 입력창 닫기 → 그림책 읽기에서 목록 → 다른 메뉴에서 홈 → 홈에서 종료 순서다. 화면 이동으로 진행 중 판을 지우지 않지만 앱 종료 후 판 복원은 없다. HTML dialog의 cancel 기본 닫기도 막아 요청 중 보호를 유지한다. 네이티브 호출은 `adapters/androidBack.ts`, 분기는 `backNavigation.ts`로 분리했다. Ionic overlay보다 낮고 라우터보다 높은 우선순위 10을 사용하며 네이티브 리스너·문서 이벤트는 해제한다. Android 동기화까지 확인했으며 실제 버튼·제스처·키보드·종료 동작은 기기 검증 대기다. 일반 브라우저/iOS에서는 Android 처리기를 등록하지 않는다.

## 구성

- React 19, Ionic 8.8.19, Capacitor core/CLI/Android 7.6.9. TDS와 토스 SDK는 사용하지 않는다.
- Ionic 라우터의 peer 요구에 맞춰 `react-router` 5.3.4를 명시한다.
- 앱 표시 이름: 영어 낱말. 기존 앱 ID `com.tcrossword.app` 유지. 스토어 등록 전에 최종 앱 ID를 확정한다.
- Android 템플릿은 minSdk 23, compileSdk/targetSdk 35, versionCode 1 / versionName 1.0이다. 토스 앱 버전과 별개다. 출시 시점의 Google Play 요구사항은 별도 확인한다.
- Android 네이티브 프로젝트는 소스로 관리한다. 복사된 웹 파일·로컬 SDK 경로·빌드 산출물·서명 키는 제외한다. 기본 아이콘은 템플릿 상태다.

## 실행

저장소 루트에서 실행한다.

```powershell
pnpm.cmd --filter @t-crossword/mobile dev
pnpm.cmd --filter @t-crossword/mobile typecheck
pnpm.cmd --filter @t-crossword/mobile test
pnpm.cmd --filter @t-crossword/mobile sync:android
pnpm.cmd --filter @t-crossword/mobile open:android
pnpm.cmd --filter @t-crossword/mobile android
```

`sync:android`는 타입 검사·웹 빌드 후 Android assets와 플러그인을 동기화한다. `android`는 이미 준비된 앱을 연결 기기/에뮬레이터에서 실행한다. 화면 수정 후 먼저 `sync:android`를 실행한다.

Android Studio 2024.2.1 이상, JDK 21, Android SDK Platform 35와 SDK 도구를 준비한다. Android Studio의 SDK Manager와 Gradle JDK 설정을 확인한다. 이 PC에서는 JAVA_HOME/PATH의 Java와 기본 Android SDK·Studio 경로를 확인하지 못했다. 개인 SDK 경로는 저장소에 고정하지 않는다.

```powershell
cd apps/mobile/android
.\gradlew.bat assembleDebug
```

성공 시 APK: `app/build/outputs/apk/debug/app-debug.apk`. 2026-10-25에는 Android Studio 프로젝트가 선택한 설치 JDK 21을 현재 명령의 `JAVA_HOME`으로만 지정해 `assembleDebug` CLI 빌드에 성공했다. 기본 PATH에는 Java가 없고 Studio 번들 Java는 25였으므로 이를 Gradle 8.11.1에 강제하지 않았다. 개인 JDK 경로는 프로젝트 설정에 고정하지 않는다. 초기 Java 부재 실패·사용자 에뮬레이터 캡처는 이전 이력이며 새 APK의 실제 설치·조작 검증은 별도다.

## 확인 결과와 다음 구현

- 사용자 Android Studio에서 JVM 25와 Gradle 8.11.1 호환 안내가 표시되어 JVM 21 선택을 안내했다. 이후 사용자 화면으로 API 37 에뮬레이터의 홈·퀴즈·그림책 실행을 확인했다. 캡처로 특정 화면 표시를 확인한 것과 기능별 기기 검증 완료는 구분한다. AGP 8.7.2 업데이트 권고는 빌드 오류가 아니며 이번 작업에서 AGP/Gradle은 변경하지 않았다.

- `sync:android` 통과: 타입 검사·Vite 프로덕션 빌드·Capacitor Android 동기화. 큰 JS 청크 경고가 있다.
- 최신 `test` 23개 통과: 익명 인증 4개, viewport 3개, 뒤로가기 분기 5개, 입력 피드백 3개, 저장/오답노트 8개. Node 24의 TypeScript 지원과 내장 테스트 러너를 사용한다. 이후 힌트 정렬·그리드·그림책 UI 수정은 타입·콘텐츠 검사·웹 빌드·Android sync로 확인했으며 기능 테스트는 반복하지 않았다. App 플러그인 등록을 확인했고 무관한 lockfile 해석을 보존한 frozen/offline 검사도 통과했다.
- 확인 필요: Android 뒤로가기 버튼/제스처·요청 중 닫힘 방지·홈 종료, 오답노트 삭제 후 재시작/힌트 재사용, 그리드 정답 표시 전후 크기, 한 장/여러 장 그림책·화살표·해석/목록 최종 배치, 키보드·회전·오프라인 이미지. 웹 빌드·분기 테스트·sync 성공으로 네이티브 동작을 보장하지 않는다.
- 다음 구현/적용: 모바일 익명 인증 운영 설정·`mobile-hints` 배포 및 실제 가입/차감/+5 검증, 네이티브 저장 보강, AdMob 연결·실제 배너 높이 반영·보상형 광고. 광고 SDK는 미설치이며 96px 가상 영역의 자동 높이 연동은 아직 미구현이다. 운영 설정·배포에는 별도 승인이 필요하다.
- iOS 프로젝트는 생성하지 않았다. 향후 네이티브 연동 시 별도 검증한다.

공식 근거: [Capacitor 7 Android](https://capacitorjs.com/docs/v7/android), [개발 환경](https://capacitorjs.com/docs/v7/getting-started/environment-setup). JDK 21 요구는 설치된 `@capacitor/android`의 Gradle 설정에서도 확인했다.

## 그림책 제작·빌드

원본은 `content/beginner-poems/poems.json`, `content/intermediate-readings/books.json`, `content/advanced-readings/books.json`이다. 앱 간 소스를 import하거나 다른 앱의 public/data 파일을 복사하지 않는다.

```powershell
python scripts/prepare-mobile-picture-books.py
node scripts/check-mobile-picture-books.mjs
```

두 명령은 저장소 루트에서 실행한다. Python/Pillow는 이미지 변경 시에만 필요하다. 변환은 EXIF 방향 정규화·RGB 변환·최대 1200×1600 내 비율 유지·WebP quality 85/method 6이며 2026-10-22 기준 기존 승인 원본을 사용했다. 새 AI 생성·원문/해석 변경은 없다. 파생 이미지/manifest/JSON은 저장소에 포함한다.

일반 `build`는 Node 검사로 원본 승인 상태·본문/해석 해시·원본/모바일 이미지 해시와 파일 목록을 대조해 JSON을 갱신한다. 원본 변경을 해시 갱신만으로 승인하지 않는다. 변환·검사 통과는 새 카드의 최종 시각 검수·기기 가독성을 대신하지 않는다.

119장의 dist 이미지가 manifest와 일치함을 확인했다(이미지 합계 29,369,890바이트). Android에 번들 자산으로 포함하며 원격 CDN·PWA service worker를 사용하지 않는다. APK 설치 후 로컬 그림책 열람의 실제 오프라인 동작은 아직 기기 검증 전이다. 웹 미리보기의 최초 이미지 로드는 미리보기 서버가 필요하다.
