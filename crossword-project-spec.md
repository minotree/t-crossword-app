# 십자낱말 영단어 통합 프로젝트 사양서 (PRD, TRD, Architecture, User Flow, Prompts)

> 작업 지침은 [AGENTS.md](AGENTS.md), 구조는 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md), 구현·검증 현황은 [progress.md](progress.md)를 따른다. 이 문서의 요구사항은 구현 완료를 뜻하지 않는다.

---

## 1. PRD (Product Requirements Document - 제품 요구사항 정의서)

### 1.1 제품 개요 및 목적
* **제품명**: 십자낱말 영단어 (Crossword Vocab) - 크로스 플랫폼 & 앱인토스 미니앱
* **목적**: 기존의 사용자 CSV 직접 업로드 방식에서 발전하여, 초급/중급/고급의 정제 단어 데이터를 앱 내에 기본 내장하고, 공통 도메인 로직을 공유하는 모노레포(`pnpm workspace`)에서 웹/PWA, Ionic 기반 iOS/Android, Apps in Toss를 독립적으로 구축·배포한다. 오프라인 기능은 플랫폼별로 지원 범위를 명시한다.
* **타겟 사용자**: 초/중/고급 영단어를 흥미롭게 복습하고 학습하고자 하는 일반 모바일 사용자 및 토스 미니앱 이용자.

### 1.2 핵심 요구사항 목록
1. **멀티 타겟 지원 (Zero Source Contamination)**
   * `pnpm workspace` 모노레포 구조로 패키지를 완전 격리하여 Ionic/Capacitor 코드와 Toss Granite/TDS 코드 간 **소스 오염 100% 방지**.
2. **내장 JSON 데이터베이스 & 난이도/격자 선택**
   * **단어 데이터**: 하나의 정제 단어장(`vocab.json`)에 난이도 컬럼(`level: beginner | intermediate | advanced`)을 포함하여 관리.
   * **난이도 선택**: 초급(Beginner), 중급(Intermediate), 고급(Advanced) 3단계 선택. 초급은 초급, 중급은 초급+중급, 고급은 전체 어휘를 누적 사용한다.
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
   * 모달 내 입력은 수정 가능한 셀 사이에서 자동 포커스 이동·백스페이스 이동을 지원한다. 다른 문제로 이미 완성된 교차 셀은 읽기 전용으로 보존하고 건너뛴다.
   * 틀린 영문 글자 입력 시 붉은색과 접근성 상태로 안내한다. 오답 표시 한도는 모달을 열 때마다 글자 수 × 2회이며, 정답 글자와 삭제는 차감하지 않는다. 소진 후에도 입력·정답 제출은 허용하고, 남은 횟수와 재실행 시 초기화 안내를 표시한다.
   * 힌트 사용 시 기존 입력을 유지하고 첫 번째 빈 셀에만 1글자를 공개한다. 빈 셀이 없으면 안내만 표시하고 차감하지 않는다. 힌트 응답 대기 중에는 입력·제출을 막아 대상 셀 변경을 방지한다.
   * 단어장에는 전체·즐겨찾기·학습완료·오답노트 탭을 제공한다. 힌트 차감에 성공한 단어를 오답노트에 중복 없이 저장하며 학습완료 후에도 유지한다. 저장 기능 적용 전의 사용 이력은 소급 복원하지 않는다.
   * 힌트 영역·정답 입력 모달·단어장에 동의어가 있으면 표시한다.
5. **백엔드 (Supabase)**
   * 익명 로그인 및 토스 식별 연동은 플랫폼별 인증 경계를 지킨다. 힌트 잔액은 서버에서 검증·차감한다.
   * 웹 학습완료·즐겨찾기·오답노트는 현재 기기 브라우저의 로컬 저장소에 보관한다. 기존 기록에 오답노트 필드가 없으면 빈 목록으로 읽으며, 학습완료 초기화는 오답노트와 즐겨찾기를 보존한다. 기기 간 학습 기록 동기화·출석·광고 보상은 구현 상태를 `progress.md`에서 확인하며 완료된 기능으로 안내하지 않는다.
6. **그림책 읽기**
   * 하단 메뉴 `그림책`에서 초급·중급·고급을 선택한다. 중급은 중·고등학생, 고급은 성인 대상이다.
   * 시·창작 에세이·소설을 제공하며 영어 본문과 삽화를 한 카드에 담는다. 페이지별 `해석 보기`, 이전·다음·목록 복귀를 지원한다.
   * 별도 보이는 영어 원문 버튼은 중복 제공하지 않으며 스크린리더용 영어 텍스트와 AI 활용 표시는 유지한다.
   * 현재 콘텐츠는 초급 45편·45장, 중급 9편·36장, 고급 7편·38장이다. 고급은 시 2편·에세이 2편·SF/현실 미스터리/법정 드라마 소설 각 1편이다. 후속 작품 분량은 사용자 요청에 따른다.
   * 원본·해석·삽화는 직접 창작하거나 이용 권한을 확인한 자료만 사용한다. 검수·권리 상태와 생성 기록을 보존하며 자세한 절차는 `AGENTS.md` 14~15절을 따른다.
   * 웹/PWA에서는 성공적으로 내려받아 캐시에 남은 이미지만 오프라인에서 다시 열 수 있다. 처음 여는 이미지는 온라인이 필요하다.
---

## 2. TRD (Technical Requirements Document - 기술 사양서)

### 2.1 개발 환경 및 기술 스택

- 공통: TypeScript strict, pnpm workspace, Supabase. 실제 설치 버전은 각 `package.json`과 lockfile을 확인한다.
- 웹/PWA: React 19, Vite, Tailwind CSS v4. UI·라우팅·브라우저 저장·서비스 워커는 `apps/web` 소유다.
- 모바일: Ionic React 8, Capacitor 7. `apps/mobile`이 독립 UI·라우팅·네이티브 연동을 소유한다.
- 토스: `apps/toss`에서 TDS와 실제 선택한 SDK의 공식 요구사항을 따른다. 현재 앱 구현은 후속 작업이며 버전·설정 파일을 미리 확정하지 않는다.
- 웹 Node 지원 범위는 `apps/web/package.json`의 `engines`를 따른다. 현재 `^20.19.0 || ^22.13.0 || >=24`이며 루트의 최소 버전만으로 호환성을 판단하지 않는다.
- 네이티브 JDK·Android SDK·Xcode 버전은 선택한 Capacitor 버전의 요구사항을 확인한다. 웹 빌드 성공을 네이티브 호환성 증명으로 사용하지 않는다.

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

## 3. 디렉토리 및 모노레포 아키텍처

상세 목표 구조는 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)를 따른다. 현재 구현 여부는 [progress.md](progress.md)에서 구분한다.

| 책임 | 위치 |
| --- | --- |
| 플랫폼별 UI·라우팅·인증/저장 어댑터 | `apps/web`, `apps/mobile`, 향후 `apps/toss` |
| 공통 DTO·포트·검증 계약 | `packages/contracts` |
| 프레임워크 독립 퍼즐·힌트·단어장 규칙 | `packages/core` |
| Supabase 클라이언트 팩토리·힌트 데이터 접근 | `packages/data` |
| 순수 유틸리티 | `packages/utils` |
| DB 스키마·RLS·RPC | `supabase/migrations`, `supabase/functions` |
| 그림책 원문·해석·원본 이미지·제작/검수 기록 | `content/beginner-poems`, `content/intermediate-readings`, `content/advanced-readings` |
| 웹용 파생 JSON·WebP | `apps/web/src/data`, `apps/web/public/picture-books` |

`packages/core`는 React·플랫폼 SDK·Supabase 클라이언트·브라우저 전역을 가져오지 않는다. UI와 라우팅은 공유하지 않으며, 공유 UI 패키지 도입에는 사용자 승인이 필요하다. 내부 패키지는 `@t-crossword/*` 공개 API와 `workspace:*`로 참조한다.

---

## 4. User Flow (사용자 흐름도)

```text
[앱 실행 / 진입]
   │
   ├──▶ [Supabase 익명 인증 / 토스 식별 키 연동]
   │       └──▶ [서버: 보유 힌트 잔액 / 웹 기기 저장: 학습완료·즐겨찾기]
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
                 ├──▶ 단어 뜻, 품사, 동의어, 스펠링 글자수 확인
                 ├──▶ 단어별 정답 입력 전용 그리드
                 │       ├──▶ 알파벳 입력 ➔ [완성된 교차 셀을 건너뛰어 자동 이동]
                 │       └──▶ 백스페이스 ➔ [완성된 교차 셀을 보존하고 수정 가능한 셀로 이동]
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

그림책 흐름: `그림책 → 난이도 → 작품 → 페이지 읽기 / 해석 보기 → 이전·다음 / 목록`. 광고 충전 흐름은 목표 요구사항이며 실제 광고 보상 연결은 미완료다.

---

## 5. AI 작업 프롬프트 기준

모든 작업 프롬프트는 먼저 `AGENTS.md`와 관련 패키지 지침을 읽도록 명시한다. 자동 로딩은 도구 설정과 실제 동작을 확인한 경우에만 신뢰한다. 다음 항목은 기존 구현을 무시하고 처음부터 재생성하라는 지시가 아니다.

### 공통 로직 작업

```text
기존 packages/contracts, core, utils의 공개 API와 테스트를 확인한다.
요청한 도메인 규칙을 프레임워크 독립적으로 변경하고 관련 테스트를 실행한다.
앱 UI나 Supabase 구현을 core에 넣지 않는다. 기존 사용자 변경을 보존한다.
```

### Supabase 작업

```text
기존 supabase/migrations/20261012_init.sql과 packages/data의 구현을 먼저 확인한다.
플랫폼별 인증 초기화와 재사용 데이터 접근을 구분한다.
사용자에게 hint_balance 직접 변경 권한을 주지 않고 서버에서 잔액을 원자적으로 차감한다.
광고 보상은 서버에서 검증한 요청만 처리하며 클라이언트가 임의 금액을 지급할 수 없게 한다.
RLS와 RPC 권한을 검토하고 실제 DB 검증 여부를 구분한다.
프로덕션 변경·파괴적 작업·배포는 별도 사용자 승인을 받는다.
```

### 플랫폼 UI 작업

```text
대상 앱의 화면·스타일·라우팅·SDK 연동만 수정한다. 공통 규칙은 공개 패키지 API를 사용한다.
메인 보드는 표시 전용으로 유지하고 힌트 목록에서 입력 모달을 연다.
입력 오류 표시·완성된 교차 셀 보존·동의어·접근성 동작을 유지한다.
타이머와 셀 더블 터치 방향 전환을 임의로 추가하지 않는다.
```

### 그림책 작업

```text
AGENTS.md 14~15절과 해당 콘텐츠 README를 확인한다.
대상 독자와 누적 어휘에 맞춰 영어 원문·해석을 작성하고 문법·내용을 먼저 검토한다.
독자적인 삽화와 제작 기록을 만들고 이미지 속 본문을 시각적으로 대조한다.
수정 시 원본·해석·이미지·기록·검수 자료를 맞춘 뒤 웹용 변환을 실행한다.
검사 통과와 최종 편집·권리 검토를 구분하고 실제 기기 확인을 임의로 완료 처리하지 않는다.
```

## 6. 개발 및 검증 명령

저장소 루트에서 실행한다. 이미 설치된 환경을 먼저 확인하고 필요한 경우에만 의존성을 설치한다.

```powershell
pnpm install --frozen-lockfile
pnpm --filter @t-crossword/web dev
pnpm --filter @t-crossword/web lint
pnpm --filter @t-crossword/web typecheck
pnpm --filter @t-crossword/web build
pnpm --filter @t-crossword/core test
pnpm --filter @t-crossword/mobile dev
```

웹 테스트는 현재 웹 전용 `test` 스크립트가 없으므로, 기존 설치 환경에서 `apps/web`로 이동한 뒤 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`로 실행한다. 루트 `pnpm test`만으로 웹 테스트까지 실행되었다고 판단하지 않는다.

```powershell
node scripts/convert-vocab.mjs words_completed.csv
python content/beginner-poems/build-gallery.py
python content/intermediate-readings/validate.py
python content/intermediate-readings/build-preview.py
python content/advanced-readings/validate.py
python content/advanced-readings/build-preview.py
python scripts/prepare-picture-books.py
```

위 데이터 변환·갤러리 명령은 파일을 갱신하므로 원본을 변경한 작업에서 필요한 것만 실행한다. 문서만 수정했다면 경로·명령·내용과 `git diff --check`를 확인한다.

웹 lint 환경은 [docs/lint.md](docs/lint.md), 배포·오프라인·기기 검증은 [docs/vercel-pwa.md](docs/vercel-pwa.md)를 따른다. 최신 실행 결과와 미검증 항목은 [progress.md](progress.md)에 기록한다. 커밋·푸시·배포는 별도 사용자 승인이 필요하다.
