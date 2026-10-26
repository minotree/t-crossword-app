# 영어 낱말 · Android / Ionic

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
