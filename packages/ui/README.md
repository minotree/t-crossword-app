# @t-crossword/ui

플랫폼 비종속 React UI를 위한 워크스페이스 패키지다. 패키지·타입 검사 기반과 Android 기준 디자인 토큰·홈 반응형 CSS가 있다. `HomeScreen`과 홈용 `HomeIcon`을 제공하고 PWA 홈에 연결했다. Android·토스는 기존 구현을 유지한다. 실제 브라우저·플랫폼 렌더링은 별도 검증 대상이다.

- 기존 패키지처럼 ESM 소스를 `exports`로 제공하고 소비 앱의 빌드 도구가 처리한다. 별도 번들 생성 단계는 없다.
- React 18.3.1 이상 18 계열과 React 19 계열을 peer로 지원한다. React는 런타임 dependencies에 포함하지 않으며 소비 앱이 제공한다. 개발 검사는 기존 workspace의 React 18과 타입을 사용한다. 컴포넌트 추가 시 두 React 계열의 실제 호환성을 별도로 검증한다.
- Ionic, Capacitor, React Router, 토스 SDK, TDS에 직접 의존하지 않는다. 플랫폼 동작·라우팅·필수 디자인 시스템은 props 또는 앱 어댑터로 연결한다.
- 최초 구현 범위는 홈 본문·상단바·하단 메뉴·화면 높이 기반 반응형 레이아웃이다. PWA 홈을 우선 적용하고 나머지 플랫폼·화면은 실제 수정 필요성이 생길 때만 공통화한다.
- CSS는 명시적 하위 경로로 export한다. 전역 초기화 없이 전용 클래스·변수를 사용하며 CSS를 제거할 수 있는 `sideEffects: false`를 패키지 전체에 지정하지 않는다.

검사: 저장소 루트에서 `pnpm --filter @t-crossword/ui typecheck`.

## CSS 사용 계약

```ts
import '@t-crossword/ui/tokens.css';
import '@t-crossword/ui/home/home.css';
```

토큰은 `.mnu-ui`에만 선언된다. 이 클래스를 홈 또는 상위 앱 영역에 부여한다. 클래스·변수 접두사는 `mnu-`다. 상단바·메뉴용 토큰도 제공하지만 상단바·메뉴는 PWA의 홈 전용 레이아웃 어댑터에서 연결한다.

```text
.mnu-ui.mnu-home
  .mnu-home__welcome
    .mnu-home__title                 홈 파란 제목 (원본 p)
    .mnu-home__body
      .mnu-home__puzzle              aria-hidden="true"
        .mnu-home__grid
          .mnu-home__cell            9개 칸
          .mnu-home__cell.mnu-home__cell--letter
      .mnu-home__heading             환영 제목
      .mnu-home__description
      .mnu-home__actions
        .mnu-home__action            퀴즈 버튼/링크
        .mnu-home__action            단어장 버튼/링크
```

버튼 클래스는 크기·타이포그래피 계약이다. 채움·테두리형 버튼의 색상·테두리·상호작용·포커스 및 플랫폼 필수 디자인 시스템은 소비 어댑터가 연결한다. Ionic Shadow DOM 내부를 일반 CSS로 제어한다고 가정하지 않는다. 원본에 명시되지 않은 Ionic 기본 버튼 테두리나 상단바의 기본 치수는 임의 토큰으로 만들지 않았다.

소비 앱은 Safe Area·플랫폼 상단 영역·광고·메뉴를 제외한 콘텐츠 영역과 `overflow-y: auto`인 스크롤 컨테이너를 제공한다. flex 스크롤 영역에는 `min-height: 0`을 적용하고 홈의 부모 가용 높이를 정한다. 홈 자체는 `100vh/100dvh`를 강제하지 않으며 `min-height: 100%`와 축소하지 않는 본문을 사용한다. 안내 배너 등이 있으면 홈이 그 높이까지 더해 스크롤될 수 있으므로 부모와 함께 확인한다. 본문 숨김·줄 수 제한·강제 축소는 하지 않는다.

기준은 `apps/mobile/src/pages/mobile.css` 1, 18–78, 110–121행과 `HomePage.tsx`의 홈 구조다. 환영 제목의 500 굵기는 모바일이 로드하는 Ionic `typography.css`의 실제 h1 기본값이다. 제목 p의 줄높이 1.6도 원본 공통 p 규칙에서 가져왔다. 모든 스타일은 클래스 선택자이며 전역 요소·`:root` 초기화를 하지 않는다.

홈 그림·간격·패딩은 vh 기본값과 dvh 지원 분기를 유지한다. 가로 방향이면서 높이 500px 이하일 때만 최대 너비 800px의 2열로 전환한다. 왼쪽 그림 열 `clamp(120px, 30vh, 144px)`는 원본처럼 vh를 유지하며, 그림 내부는 32px 칸이다. 오른쪽 버튼은 세로 1열이다. 원본 대비 새 디자인 값은 추가하지 않았다. 줄바꿈은 홈 범위에 keep-all/break-word를 적용했다.

## 전체 토큰

아래 이름에는 모두 `--mnu-` 접두사를 붙인다. 토큰은 앱 외부로 기본값을 전파하지 않는다.

| 이름 | 값 |
| --- | --- |
| color-text / color-secondary | #191f28 / #6b7684 |
| color-primary / color-primary-strong | #3182f6 / #1b64da |
| color-surface / color-soft / color-nav | #fff / #e8f3ff / #f2f7ff |
| font-family | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| font-learned / font-description / font-action | 13px / 14px / 15px |
| font-title / font-welcome / font-letter / font-nav | 18px / 20px / 20px / 11px |
| weight-action / weight-heading / weight-bold / weight-letter | 600 / 500 / 700 / 800 |
| line-description / line-welcome | 1.6 / 1.5 |
| space-4 / space-6 / space-8 / space-10 / space-12 / space-14 / space-16 / space-20 | 4px / 6px / 8px / 10px / 12px / 14px / 16px / 20px |
| radius-control / radius-cell / radius-puzzle | 12px / 4px / 50% |
| border-puzzle | 4px solid var(--mnu-color-surface) |
| shadow-puzzle | 0 6px 20px #191f2814 |
| home-max-width / home-landscape-max-width | 448px / 800px |
| home-action-min-height / home-grid-width / home-landscape-cell | 52px / 70% / 32px |
| nav-min-height / nav-icon-size | 58px / 24px |
| compact-control-min-height / compact-nav-icon-size | 44px / 20px |
| home-puzzle-size (home.css) | clamp(128px, 23vh, 208px); 지원 시 23dvh |
| home-gap (home.css) | clamp(8px, 2vh, 24px); 지원 시 2dvh |
| home-padding (home.css) | clamp(12px, 2.5vh, 28px); 지원 시 2.5dvh |

상단 학습 수는 learned·secondary·space-20 토큰을 사용한다. 낮은 가로 화면의 상단 제목은 title·space-12, 상단/메뉴 최소 높이는 compact-control-min-height다. 메뉴는 nav 토큰과 space-6/8/12/4, radius-control, soft/primary-strong/bold를 조합한다. 상단바의 일반 높이·제목 크기 등 Ionic 기본값은 소비 플랫폼 검토 후 연결한다.

## React 연결

`HomeScreen`은 `quizAction`, `wordBankAction`에 React 요소를 받는다. 소비 앱이 링크·버튼과 `.mnu-home__action` 클래스를 제공한다. 라우터·저장소는 공통 UI에 포함하지 않는다. PWA는 기존 학습 기록 저장소를 구독하고 Vite `resolve.dedupe`에 react/react-dom을 지정한다. 개발용 React 18과 소비 앱의 React 19를 혼용하지 않도록 소비 앱의 런타임을 사용한다.

`HomeIcon`의 5개 SVG는 Android가 사용하는 설치된 Ionicons 7.4.0 outline 원본을 JSX로 변환했다. 신규 런타임 의존성은 없다. 원본은 `ionicons/dist/svg`, 저작권자는 Ionic이며 MIT 이용 조건 전체를 HomeIcon.tsx의 보존용 라이선스 주석에 포함했다. 로컬 원본·라이선스 확인일: 2026-11-28.

## 학습 응원 문구

`LearningEncouragement`는 `{ english, korean }` 문구와 `audioControl`을 받는다. 소비 앱은 `@t-crossword/ui/encouragement/encouragement.css`를 불러오고 성공한 퍼즐 버전을 React key로 전달한다. 같은 퍼즐의 재렌더링에서는 색상·해석 상태를 유지하고 새 퍼즐에서 해석을 닫으며 Android와 같은 파란색/회색을 선택한다. 영어는 16px·600·중앙 정렬이며 해석은 기본 숨김이다. 오디오 재생과 화면 이탈 정리는 소비 앱이 담당한다.

공통 데이터·순환 선택·기존 MP3 주소는 `@t-crossword/core/encouragement`에서 제공한다. 원본 50개 문구와 음성 manifest는 Android·토스 데이터를 변경 없이 복사했으며 기존 앱 데이터는 보존한다. 출처와 음성 제작·검수 기록은 `content/encouragement-audio/README.md`를 따른다. 새로운 문구·음성을 제작하거나 외부 작가의 명언으로 표시하지 않는다. PWA에서 응원 문구는 오프라인에서도 표시되지만 MP3 듣기는 인터넷 연결이 필요하다. 기존 단어장 재생은 시작 전에 중지하고 응원 음성은 문구 변경·화면 이탈·백그라운드 전환 시 정리한다. 브라우저 실제 음량·재생 정책·작은 화면 배치는 자동 검사와 별도로 검증한다.
