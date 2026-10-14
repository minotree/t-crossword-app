# 십자낱말 영단어 통합 프로젝트 사양서 (PRD, TRD, Architecture, User Flow, Prompts)

---

## 1. PRD (Product Requirements Document - 제품 요구사항 정의서)

### 1.1 제품 개요 및 목적
* **제품명**: 십자낱말 영단어 (Crossword Vocab) - 크로스 플랫폼 & 앱인토스 미니앱
* **목적**: 기존의 사용자 CSV 직접 업로드 방식에서 발전하여, 초급/중급/고급의 정제 단어 데이터를 앱 내에 기본 내장하고, 단일 코드베이스 모노레포(`pnpm workspace`) 구조를 통해 크로스 플랫폼(iOS/Android/PWA)과 앱인토스(Apps in Toss) 양쪽 서비스에 안정적으로 동시 배포 가능한 오프라인 퍼스트 십자낱말 학습 앱 구축.
* **타겟 사용자**: 초/중/고급 영단어를 흥미롭게 복습하고 학습하고자 하는 일반 모바일 사용자 및 토스 미니앱 이용자.

### 1.2 핵심 요구사항 목록
1. **멀티 타겟 지원 (Zero Source Contamination)**
   * `pnpm workspace` 모노레포 구조로 패키지를 완전 격리하여 Ionic/Capacitor 코드와 Toss Granite/TDS 코드 간 **소스 오염 100% 방지**.
2. **내장 JSON 데이터베이스 & 난이도/격자 선택**
   * **단어 데이터**: 하나의 정제 단어장(`vocab.json`)에 난이도 컬럼(`level: beginner | intermediate | advanced`)을 포함하여 관리.
   * **난이도 선택**: 초급(Beginner), 중급(Intermediate), 고급(Advanced) 3단계 선택.
   * **격자 크기 선택**: 8x8, 10x10, 12x12 선택 유지.
   * **최소 단어 길이 제약**: **최소 3글자 이상** 어휘만 퍼즐에 출제.
3. **고도화된 힌트 및 광고 정책 (Dynamic Hint System)**
   * **글로벌 힌트 지갑(Hint Wallet)**: 출석 보상 및 동영상 광고 시청으로 충전 (1회 사용 시 1글자 공개 및 -1 차감).
   * **단어 스펠링 길이별 힌트 사용 한도**:
     - **3~4글자 단어**: 해당 단어당 최대 **1개**
     - **5~6글자 단어**: 해당 단어당 최대 **2개**
     - **7글자 이상 단어**: 해당 단어당 최대 **3개**
   * **퍼즐 초기화/변경 정책**: 퍼즐 포기나 난이도/격자 변경 시 글로벌 힌트 잔액은 차감된 상태 그대로 유지되나, 새 판 시작 시 단어별 사용 힌트 카운트는 0으로 리셋됨.
4. **사용자 UI/UX 개편**
   * 퍼즐 풀이 시간 측정(Timer) 및 일시정지 기능 **제공 안 함**.
   * 메인 그리드의 셀 더블 터치 가로/세로 방향 전환 기능 **제공 안 함**.
   * 메인 그리드 하단에 가로/세로 힌트 박스 제공 ➔ 힌트 항목 선택 시 **[정답 입력 모달]** 오픈.
   * [정답 입력 모달] 내부에서 단어 뜻, 글자수, 전용 입력 그리드, 단어 힌트 버튼 제공.
   * 모달 내 입력 칸 글자 입력 시 다음 셀로 **자동 포커스 이동 (Auto-Advance)** 및 백스페이스 클릭 시 이전 셀 삭제 및 이동.
5. **백엔드 (Supabase)**
   * 익명 로그인 및 토스 식별 키 기반 데이터 동기화 (보유 힌트 잔액, 출석 보상, 오답노트/북마크).
---

## 2. TRD (Technical Requirements Document - 기술 사양서)

### 2.1 개발 환경 및 기술 스택
* **IDE / Tooling**: Antigravity IDE / VS Code + Antigravity CLI (`agy`)
* **주언어**: TypeScript 5.x
* **패키지 매니저**: pnpm (pnpm workspace)
* **백엔드**: Supabase (Database, Auth, RLS, RPC)
* **Target 1 (Cross-platform)**: React 18 + Vite + Ionic React + Capacitor 6 (iOS/Android/PWA) + AdMob
* **Target 2 (Apps in Toss)**: React 18 + Vite + TDS (Toss Design System) + Granite CLI + Toss SDK + Toss Reward Ads
* **개발 도구**: Node.js v20+, Git, Android Studio Jellyfish+

### 2.2 힌트 한도 산출 핵심 함수 (`packages/core/src/utils/hintLimit.ts`)
```typescript
/**
 * 단어 스펠링 길이에 따른 최대 힌트 허용 개수 반환
 */
export const getWordHintLimit = (word: string): number => {
  const len = word.trim().length;
  if (len < 3) return 0;  // 3자 미만 제외
  if (len <= 4) return 1; // 3~4자 -> 1개
  if (len <= 6) return 2; // 5~6자 -> 2개
  return 3;              // 7자 이상 -> 3개
};
```

---

## 3. 디렉토리 및 모노레포 아키텍처 (Directory & Monorepo Architecture)

```text
crossword-monorepo/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── packages/
│   ├── core/                      # [공통 비즈니스 로직 & 데이터]
│   │   ├── src/
│   │   │   ├── algorithms/        # crosswordGenerator.ts (탐욕적 교차 배치)
│   │   │   ├── assets/            # vocab.json (단일 정제 단어장)
│   │   │   ├── services/          # wordBankService.ts, supabaseClient.ts, hintManager.ts
│   │   │   ├── types/             # WordItem, CrosswordCell, HintPolicy, GameState
│   │   │   └── utils/             # hintLimit.ts
│   │   └── package.json
│   └── ui/                        # [공통 UI 컴포넌트]
│       ├── src/
│       │   ├── Grid/              # CrosswordBoard.tsx (메인 십자낱말 보드)
│       │   ├── HintBox/           # HintListSection.tsx (하단 가로/세로 힌트 박스)
│       │   ├── Modals/            # WordInputModal.tsx (정답 입력 모달), WordBankModal.tsx, PuzzleCompletionModal.tsx
│       │   └── Keyboard/          # VirtualKeyboard.tsx
│       └── package.json
└── apps/
    ├── crossplatform/             # [타겟 1] Ionic + Capacitor + AdMob App
    │   ├── vite.config.ts
    │   ├── capacitor.config.ts
    │   ├── src/main.tsx
    │   └── package.json
    └── toss/                      # [타겟 2] Apps in Toss (TDS + Granite) App
        ├── vite.config.ts
        ├── granite.config.ts
        ├── src/main.tsx
        └── package.json
```

---

## 4. User Flow (사용자 흐름도)

```text
[앱 실행 / 진입]
   │
   ├──▶ [Supabase 익명 인증 / 토스 식별 키 연동]
   │       └──▶ [서버 동기화: 보유 힌트 잔액, 학습 기록, 북마크]
   │
   ▼
[메인 화면]
   │
   ├──▶ [상단 영역: 난이도 선택 (초/중/고) | 격자 크기 선택 (8x8/10x10/12x12) | 글로벌 보유 힌트 수]
   │
   ├──▶ [중앙 영역: 메인 십자낱말 보드 (CrosswordBoard - 완성된 글자 및 상태 표시)]
   │
   └──▶ [하단 영역: 힌트 박스 (HintListSection - 가로/세로 힌트 목록)]
         │
         └──▶ [힌트 항목 선택 클릭]
                 │
                 ▼
         [정답 입력 모달 (WordInputModal)]
                 │
                 ├──▶ 단어 뜻, 품사, 스펠링 글자수 확인
                 ├──▶ 단어별 정답 입력 전용 그리드
                 │       ├──▶ 알파벳 입력 ➔ [자동 포커스 이동 (Auto-Advance)]
                 │       └──▶ 백스페이스 ➔ [이전 셀 글자 삭제 및 이동]
                 │
                 ├──▶ [단어 힌트 버튼 클릭]
                 │       ├──▶ (단어 남은 힌트 > 0 AND 글로벌 힌트 > 0)
                 │       │      └──▶ 모달 내 빈 셀 1글자 공개 / 글로벌 힌트 -1 / 단어 힌트 사용량 +1
                 │       └──▶ (글로벌 힌트 0개) ──▶ [광고 시청 팝업] ──▶ [광고 완료] ──▶ [글로벌 힌트 +3~5 충전]
                 │
                 └──▶ [정답 제출 / 완료]
                         └──▶ 모달이 닫히며 메인 보드 해당 위치에 글자 반영
                                 │
                                 └──▶ [모든 단어 정답 완성 시] ──▶ [완주 축하 모달 (PuzzleCompletionModal)]
```

---

## 5. Prompt Design (AI 코딩 에이전트용 프롬프트 세트)

### [Prompt 0] 시스템 공통 규칙 및 스타일 가이드 (System Prompt)
```text
[Role & Context]
너는 TypeScript 기반 모노레포(pnpm workspace) 전문가이자 React / Ionic / Toss Design System / Supabase에 능통한 수석 프론트엔드 아키텍트이다.
현재 프로젝트는 하나의 모노레포에서 (1) Ionic+Capacitor 기반 크로스 플랫폼 앱(`apps/crossplatform`)과 (2) 토스 미니앱(`apps/toss`)을 완전 분리하여 구축하는 십자낱말 영단어 게임이다.

[Strict Workspace Constraints]
1. `apps/toss` 패키지에는 `@ionic/react`, `@capacitor/core` 등 Ionic 관련 패키지를 절대 import 하지 마라.
2. `apps/crossplatform` 패키지에는 `@toss/tds`, `granite` 관련 패키지를 절대 import 하지 마라.
3. 공통 데이터 모델, 십자낱말 생성 알고리즘, 힌트 정책 계산기, Supabase 클라이언트는 반드시 `packages/core`에만 위치시켜라.
4. 모든 코드는 TypeScript strict mode를 준수하고 Any 타입을 금지한다.
5. 퍼즐 풀이 시간 측정(Timer) 기능 및 메인 그리드 셀 더블 터치 방향 전환 로직은 작성하지 말 것.
```

### [Prompt 1] Monorepo 워크스페이스 스케폴딩 & 패키지 경계 설정
```text
[Goal]
pnpm workspace 기반의 모노레포 기본 구조와 패키지 간 경계를 설정해줘.

[Target Directory Structure]
- pnpm-workspace.yaml
- package.json (root)
- tsconfig.base.json
- packages/core/
- packages/ui/
- apps/crossplatform/
- apps/toss/

[Requirements]
1. `pnpm-workspace.yaml`에 `packages/*` 및 `apps/*`를 포함하도록 작성해줘.
2. 루트 `package.json`에는 공통 빌드 스크립트(`build:core`, `dev:cross`, `dev:toss`)를 작성해줘.
3. `tsconfig.base.json`을 작성하고 패키지 간 경로 별칭(Path Aliases: `@crossword/core`, `@crossword/ui`)을 설정해줘.
4. `packages/core` 및 `packages/ui` 패키지의 `package.json`을 작성하여, 다른 apps 패키지에서 workspace 참조(`workspace:*`)가 가능하도록 패키지명을 `@crossword/core`, `@crossword/ui`로 지정해줘.
```

### [Prompt 2] `@crossword/core` - 단어장 데이터 & 비즈니스 로직
```text
[Goal]
`packages/core` 패키지에 타입 정의, 내장 JSON 단어장 로더, 십자낱말 생성 알고리즘, 힌트 계산 유틸리티, 단어장 서비스(`wordBankService`)를 구현해줘.

[Target Files]
- packages/core/src/types/index.ts
- packages/core/src/assets/vocab.json
- packages/core/src/utils/hintLimit.ts
- packages/core/src/algorithms/crosswordGenerator.ts
- packages/core/src/services/wordBankService.ts
- packages/core/src/index.ts

[Requirements]
1. `types/index.ts`:
   - `DifficultyLevel`: 'beginner' | 'intermediate' | 'advanced'
   - `GridSize`: 8 | 10 | 12
   - `WordItem`: { id: string; level: DifficultyLevel; word: string; meaning: string; partOfSpeech: string; example: string; exampleMeaning: string; synonym?: string; isBookmarked?: boolean; isQuizUsed?: boolean; }
   - `CrosswordCell`: { row: number; col: number; letter: string; isStartOfAcross?: boolean; isStartOfDown?: boolean; acrossNumber?: number; downNumber?: number; }
   - `CrosswordWord`: { id: string; word: string; meaning: string; orientation: 'across' | 'down'; startRow: number; startCol: number; number: number; hintLimit: number; hintUsedCount: number; }

2. `utils/hintLimit.ts`:
   - `getWordHintLimit(word: string): number` 구현 (3~4자: 1개, 5~6자: 2개, 7자 이상: 3개, 3자 미만: 0개).

3. `algorithms/crosswordGenerator.ts`:
   - `generateCrossword(vocabList: WordItem[], level: DifficultyLevel, gridSize: GridSize)` 구현.
   - 단어 최소 길이는 3자 이상만 필터링할 것.
   - 탐욕적 교차 알고리즘 적용 및 단어 인접성(통짜 블록화) 방지 경계 검사 logic 포함.
   - 생성된 단어 객체에는 `getWordHintLimit(word)`를 호출하여 `hintLimit` 값을 자동 할당할 것.

4. `services/wordBankService.ts`:
   - 내장 `vocab.json` 로드, `toggleBookmark()`, `markWordAsUsed()`, `searchWords()` 구현.
```

### [Prompt 3] Supabase 백엔드 연동 & RLS / 힌트 충전 RPC
```text
[Goal]
Supabase 데이터베이스 Schema SQL과 유저 프로필/힌트 지갑 관리 클라이언트를 구현해줘.

[Target Files]
- supabase/migrations/20261012_init.sql
- packages/core/src/services/supabaseClient.ts
- packages/core/src/services/hintManager.ts

[Requirements]
1. `20261012_init.sql`:
   - `user_profiles` 테이블 생성: `id (UUID, PK, auth.users 참조)`, `hint_balance (INTEGER, DEFAULT 10)`, `updated_at (TIMESTAMP)`
   - RLS 정책 작성: 본인 행에 대해서만 SELECT, UPDATE 허용.
   - RPC 함수 작성 `grant_ad_reward_hints(p_user_id UUID, p_amount INT)`: 안전하게 `hint_balance = hint_balance + p_amount` 수행 후 변경된 잔액 반환.
2. `supabaseClient.ts` & `hintManager.ts`:
   - Supabase 클라이언트 초기화, `getUserHintBalance()`, `consumeGlobalHint()`, `claimAdReward()` 구현.
```

### [Prompt 4] `@crossword/ui` - 하단 힌트 박스 & 정답 입력 모달 UI
```text
[Goal]
`packages/ui` 패키지에 타이머를 제거하고, 하단 힌트 박스 선택 기반의 정답 입력 모달 시스템 및 공통 UI 컴포넌트를 구현해줘.

[Target Files]
- packages/ui/src/Grid/CrosswordBoard.tsx
- packages/ui/src/HintBox/HintListSection.tsx
- packages/ui/src/Modals/WordInputModal.tsx
- packages/ui/src/Modals/WordBankModal.tsx
- packages/ui/src/Modals/PuzzleCompletionModal.tsx
- packages/ui/src/Keyboard/VirtualKeyboard.tsx
- packages/ui/src/index.ts

[Requirements & UX Rules]
1. `CrosswordBoard.tsx`:
   - 메인 보드는 배치된 글자 및 완성 상태만 시각적으로 표시함.
   - 셀 더블 터치 방향 전환 및 타이머(Timer) 로직은 절대로 포함하지 말 것.
2. `HintBox/HintListSection.tsx`:
   - 메인 보드 하단에 [가로 힌트] 및 [세로 힌트] 리스트를 분리 표시함.
   - 각 항목 클릭 시 `WordInputModal`을 오픈함.
3. `Modals/WordInputModal.tsx`:
   - 선택된 힌트 정보(단어 뜻, 품사, 글자수) 및 스펠링 길이만큼 전용 입력 셀 그리드 생성.
   - 모달 내 글자 입력 시 다음 셀로 자동 포커스 이동 (Auto-Advance), 백스페이스 시 이전 셀 삭제 및 이동.
   - 단어별 힌트 사용 버튼: `getWordHintLimit(word)` 기반 한도 표시 (예: 0/1). 클릭 시 모달 내 빈 셀 1글자 공개 및 글로벌 힌트 -1 차감.
   - 정답 완료 시 모달이 닫히며 메인 보드(`CrosswordBoard`)의 해당 영역에 글자가 즉시 반영됨.
4. `PuzzleCompletionModal.tsx`:
   - 퍼즐 모든 단어 완성 시 완주 축하 팝업 출력 (사용한 총 힌트 개수, 출제 단어 복습 리스트 제공).
```

### [Prompt 5] `apps/crossplatform` & `apps/toss` 타겟 앱 진입점 연동
```text
[Goal]
`apps/crossplatform` 및 `apps/toss` 모듈에 각각 Ionic/Capacitor/AdMob 및 Toss TDS/Granite/리워드광고를 연결하여 진입점을 구성해줘.

[Requirements]
1. 메인 레이아웃: 상단(난이도/격자크기/글로벌 힌트), 중앙(메인 보드), 하단(가로/세로 힌트 박스).
2. 힌트 박스 ➔ 정답 입력 모달 오픈 ➔ 모달 내 힌트 버튼 클릭 시 광고 연동 및 힌트 차감/충전 수행.
3. 퍼즐 완성 시 완주 모달 출력 및 학습 이력 저장.
```

---

## 6. 개발 환경 세팅 가이드 (Development Environment Setup)

### 6.1 필수 의존성 소프트웨어 설치 및 버전
* **Node.js**: v20.x LTS 이상
* **pnpm**: v9.x 이상 (`npm install -g pnpm`)
* **Java/JDK**: OpenJDK 17 (Android Studio 빌드용)
* **Android Studio**: Jellyfish (2024.1.1) 이상 & Android SDK 34+

### 6.2 프로젝트 초기화 및 빌드 명령어
```bash
# 1. 저장소 이동 및 pnpm 의존성 설치
pnpm install

# 2. 공통 패키지 라이브러리 빌드
pnpm --filter @crossword/core build
pnpm --filter @crossword/ui build

# 3. 타겟별 개발 서버 실행
# 3.1 크로스 플랫폼 (Ionic/Capacitor PWA)
pnpm --filter crossplatform dev

# 3.2 앱인토스 미니앱 (Toss Granite)
pnpm --filter toss dev
```
