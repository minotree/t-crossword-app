# 십자낱말 영단어 앱 (t-crossword-app) 구현 진행표

> 프로젝트 사양서(`crossword-project-spec.md`) 및 `AGENTS.md` 가이드라인에 따른 단계별 구현 현황입니다.  
> 완료된 항목은 `[x]`로 체크하여 관리합니다.

---

## 📌 Phase 1. 모노레포 기반 구축 및 패키지 경계 설정
- [x] pnpm workspace 설정 (`pnpm-workspace.yaml`, 루트 `package.json`, `tsconfig.base.json`)
- [x] 패키지 디렉토리 구조 스캐폴딩
  - [x] `packages/contracts`: 공통 DTO, 인터페이스, 스키마
  - [x] `packages/core`: 프레임워크 독립적 도메인 로직 및 알고리즘
  - [x] `packages/data`: Supabase 데이터 접근 계층
  - [x] `packages/utils`: 순수 유틸리티 함수
  - [x] `apps/web`: React 19 + Vite + Tailwind CSS v4
  - [x] `apps/mobile`: Ionic React 8 + Capacitor 7
- [x] 워크스페이스 간 타입체크(`pnpm typecheck`) 및 패키지 참조 정상 연결 확인

---

## 📌 Phase 2. 도메인 모델 & 코어 알고리즘 (`@t-crossword/core`)
- [x] 도메인 타입 정의 (`packages/core/src/types/index.ts`)
  - `DifficultyLevel`, `GridSize`, `WordItem`, `CrosswordCell`, `CrosswordWord`, `CrosswordPuzzle`
- [x] 단어 길이별 힌트 한도 산출기 (`packages/core/src/utils/hintLimit.ts`)
  - 3~4자: 최대 1개 / 5~6자: 최대 2개 / 7자 이상: 최대 3개 / 3자 미만: 0개
- [x] 십자낱말 탐욕적 자동 배치 알고리즘 (`packages/core/src/algorithms/crosswordGenerator.ts`)
  - 8x8, 10x10, 12x12 격자 크기 지원
  - 단어 교차 검증 및 블록화(단어 간 인접 충돌) 방지 로직
  - 가로/세로 단어 번호 부여 및 셀 번호 동기화
- [x] 단어장 서비스 로직 (`packages/core/src/services/wordBankService.ts`)
- [x] CSV -> `vocab.json` 변환 스크립트 작성 (`scripts/convert-vocab.mjs`)

---

## 📌 Phase 3. 단어 데이터 정제 및 파이프라인 (이전 작업 이력)
> 정제·보강 스크립트와 중간 데이터는 사용자 요청으로 삭제했다. 현재 유지하는 변환 경로는 `words_completed.csv` → `scripts/convert-vocab.mjs` → `packages/core/src/assets/vocab.json`이다.
- [x] 단어 확장/보강 파이썬 파이프라인 (`enrich_words.py`)
- [x] 외래 스크립트(러시아어 키릴, 한자 등) 및 비정상 문자 필터링 장치
- [x] 단어 데이터 오류 자동 수리(Auto-repair) 및 한글 정제 로직 고도화
- [ ] 단어 데이터베이스(`words_completed.csv`) 최종 정제 및 `vocab.json` 반영 *(사용자 진행 중)*

---

## 📌 Phase 4. 웹 화면 구현 (`apps/web`) [기능 구현 진행 중; PWA·실기기 검증 미완료]
- [x] **4.1 게임 상태 관리 훅 (`useCrosswordGame.ts`)**
  - [x] 난이도(`beginner`, `intermediate`, `advanced`) 및 격자 크기(`8`, `10`, `12`) 상태 관리
  - [x] `@t-crossword/core`의 `generateCrossword`를 통한 퍼즐 생성/리셋
  - [x] 글로벌 힌트 지갑(초기 10개) 및 단어별 사용 힌트 카운트 추적
  - [x] 사용자 입력 글자 그리드 매핑 및 단어 일치 검증
  - [x] 전체 단어 완성 감지
- [x] **4.2 메인 십자낱말 보드 (`CrosswordBoard.tsx`)**
  - [x] 8x8 ~ 12x12 격자 그리드 반응형 렌더링
  - [x] 시작 셀 단어 번호(가로/세로) 표시
  - [x] 선택된 단어/셀 하이라이트
  - [x] 그리드는 표시 전용; 가로·세로 힌트 선택 시에만 [정답 입력 모달] 오픈
- [x] **4.3 가로/세로 힌트 목록 (`HintListSection.tsx`)**
  - [x] [가로 힌트] 및 [세로 힌트] 분리 카드형 레이아웃
  - [x] 단어 번호, 품사, 뜻, 글자 수 배지 표시
  - [x] 맞춘 단어 취소선 및 완료 체크 표시
  - [x] 항목 클릭 시 [정답 입력 모달] 오픈
- [x] **4.4 정답 입력 모달 (`WordInputModal.tsx`)**
  - [x] 단어 뜻, 품사, 글자 수 안내 헤더
  - [x] 글자 수만큼의 인라인 입력 셀
  - [x] 자동 포커스 이동 (Auto-Advance) 및 백스페이스 이전 칸 이동/삭제
  - [x] 단어별 힌트 버튼: 단어 한도(0/1, 0/2, 0/3) 표시, 클릭 시 빈 칸 1글자 공개 및 글로벌 힌트 -1 차감
  - [x] 정답 확인 시 보드에 글자 즉시 반영 후 모달 닫힘
- [x] **4.5 퍼즐 완성 축하 모달 (`PuzzleCompletionModal.tsx`)**
  - [x] 완주 축하 메시지 및 사용한 힌트 통계
  - [x] 출제된 단어/뜻 복습 리스트
  - [x] '다음 퍼즐 풀기' 액션
- [x] **4.6 퍼즐 화면 통합 (`QuizPage.tsx`)**
  - [x] 난이도 선택 버튼, 격자 크기(8x8, 10x10, 12x12) 버튼, 힌트 지갑 잔액 배지, '새 퍼즐' 버튼
  - [x] 보드 및 힌트 섹션 배치 (모바일/데스크톱 반응형)
- [x] **4.7 웹 타입 검사 및 프로덕션 빌드**
  - [x] 설치된 Node.js로 웹 `tsc --noEmit`, `vite build` 실행·통과 (상세 검증 이력은 아래 참고)
  - [ ] 최신 변경의 실제 브라우저·스마트폰·태블릿 화면 검증

### 추가 작업 기록 (2026-10-15)

개발 순서: **웹의 모든 기능 구현·검증 → 하이브리드 앱 → 토스 미니앱**. 플랫폼별 UI·라우팅·인증·저장은 분리하고, 퍼즐과 학습 관련 공통 규칙은 공유 패키지에서 관리한다.

#### 퍼즐 생성 및 출제 조건
- [x] 실제 교차를 요구하고 같은 방향 중복 배치·단어 앞뒤 및 측면 인접 충돌 방지
- [x] 교차 셀 보존, 시작 칸만 행 우선 순서로 번호 부여, 같은 시작 칸의 가로·세로 번호 통일
- [x] 원래 배치 외에 시작 단어·순서를 바꾼 8회 추가 시도 후 단어 수가 많은 퍼즐 선택
- [x] 초급: `beginner`, 중급: `beginner` + `intermediate`, 고급: 모든 난이도 포함
- [x] `isQuizUsed === false`인 단어만 출제; `true` 또는 미정의 값 제외
- [x] 정답 제출 또는 힌트로 단어 완성 시 학습완료 처리, 다음 퍼즐에서 제외
- [x] 출제 가능한 미학습 단어가 없으면 안내 표시

#### 화면 및 반응형 레이아웃
- [x] 홈(`/`): 환영 문구, 퍼즐 시작·단어장 버튼; 중앙 이미지는 임시 퍼즐 그림
- [x] 퀴즈(`/quiz`), 단어장(`/word-bank`), 설정(`/settings`) 화면 분리
- [x] 하단 홈·퀴즈 풀기·단어장·설정 메뉴; 본문만 스크롤하고 메뉴 영역 유지
- [x] 타이틀·설정 메뉴·그리드·힌트·단어장·하단 메뉴 폭 기준 정렬
- [x] 스마트폰 화면 폭에 맞춰 축소, 태블릿 등에서는 최대 896px까지 확장
- [x] 좁은 화면도 가로·세로 힌트 좌우 2열 유지; 여백 축소 및 영문 제목 숨김
- [x] 입력 후 그리드 행 높이가 늘어나지 않도록 동일 행 높이 및 셀 최소 크기 조정
- [x] 퀴즈 상단 단어장 링크, 단어장 상단 퍼즐 풀기 링크 제거
- [x] 작은 화면에서도 '새 퍼즐' 버튼 글자 표시

#### 정답 입력 모달
- [x] 방향·번호·길이: '가로 4번, 5자' 또는 '세로 4번, 5자'
- [x] '정답입력', 힌트·잔여 개수·닫기·입력 안내 문구 한국어 적용
- [x] 뜻 아래 영어 예문 표시; 정답 단어를 길이만큼 `_`로 가림
  - 대소문자 무시, 모든 반복 등장 처리, 다른 단어의 일부는 가리지 않음
- [x] 영문 이외의 문자 입력 시 영문 입력 및 한/영 전환 안내; 영문 입력 시 안내 해제
  - 웹에서 운영체제 입력 언어를 강제로 전환하는 기능은 적용하지 않음

#### 기기 학습 기록·단어장·설정
- [x] 웹 어댑터 `wordProgress.ts`: `localStorage`에 학습완료·즐겨찾기 단어 ID 저장
  - 저장 키: `t-crossword.word-progress.v1`; 원본 `vocab.json`은 수정하지 않음
  - 새로고침 후 복원, 다른 탭 저장 변경 반영, 읽기·쓰기 실패 안내
- [x] 단어장 전체·즐겨찾기·학습완료 탭, 단어·뜻 검색, 예문 표시, 즐겨찾기 토글
- [x] 설정: 학습완료 개수 및 학습 기록 초기화
  - 확인 창 후 초기화, 즐겨찾기 유지, 저장 실패 시 기존 학습 기록 보존
- [x] 앱 정보: 앱 이름·패키지 버전(`0.0.0`)·웹 기술 스택 표시
- [x] 앱 정보의 '유민이를 위하여' 문구 제거

#### 검증 이력 및 남은 작업
아래 명령은 `pnpm`이 셸 PATH에 없어 설치된 Node.js 실행 파일로 직접 실행했다.
Node 경로: `C:\Users\Administrator\AppData\Local\Author Software\nvm\installs\v24.21.0\node.exe`.

- [x] `packages/core`에서 `node node_modules/vitest/vitest.mjs run`: 마지막 실행 **20개 테스트 통과** (퍼즐 17개, 예문 가리기 3개)
- [x] `packages/core`에서 `node node_modules/typescript/bin/tsc --noEmit`: 통과
- [x] `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests/wordProgress.test.ts`: 마지막 실행 **7개 테스트 통과** (저장·복원·재출제 제외·초기화·실패 처리)
- [x] `apps/web`에서 `node node_modules/typescript/bin/tsc --noEmit` 및 `node node_modules/vite/bin/vite.js build`: 예문 표시 변경까지 통과
  - 이후 영문 입력 안내 변경은 공백 검사만 수행; 최신 코드 전체 타입 검사·빌드는 재실행 필요
  - 빌드에서 500kB 초과 청크 경고 발생; 번들 최적화 미완료
- [x] `apps/mobile` 타입 검사: 이전 공유 생성기 변경 시 통과; 이후 변경의 최신 검증은 미실행
- [ ] 웹 lint: ESLint 미설치로 미실행
- [ ] 실제 브라우저 및 스마트폰·태블릿에서 레이아웃·모달·하단 메뉴·저장·초기화 검증
- [x] PWA manifest·192/512px 아이콘·빌드 해시별 서비스 워커·업데이트 안내 구현
- [x] 오프라인 로컬 퍼즐·단어장·학습 기록 사용 경로 및 온라인 전용 힌트 안내 구현
- [ ] PWA 설치·오프라인 재실행·업데이트 실제 브라우저/기기 검증
- [ ] 웹 광고 시청·보상 검증 및 힌트 충전 UI 연결
- [ ] 모바일·토스 UI, 기기 저장 및 인증 어댑터 구현 (현재 영구 저장은 웹만 연결)

학습완료·즐겨찾기는 해당 브라우저·사이트에 저장되며, 사이트 데이터 삭제 시 사라지고 다른 기기와 동기화되지 않는다. 힌트 잔액은 이 기록과 별개로 Supabase의 사용자별 `hint_balance`를 조회·차감하며, 새 퍼즐에서도 유지한다.

#### 개발 파일 정리
- [x] Aider 캐시 `.aider.tags.cache.v4/` 삭제
- [x] CSV → JSON 변환에 필요한 `words_completed.csv`, `scripts/convert-vocab.mjs` 및 기존 `vocab.json` 유지
- [x] 중간 데이터 삭제: `english_vocabulary_3342_completed.csv`, `word_progress.sqlite3`, `bad_words.txt`, `failed_words.csv`
- [x] 보강·검사·재처리 스크립트 삭제: `enrich_words.py`, `scripts/find_bad_words.py`, `scripts/find_invalid_words.py`, `scripts/run_redo.py`
- [x] 앱 소스·설정·환경 파일·의존성·웹 빌드 결과 유지; JSON 재변환은 실행하지 않음
- 변환 명령 (프로젝트 루트): `node scripts/convert-vocab.mjs words_completed.csv`

#### Vercel / PWA 준비
- [x] 루트 `vercel.json`: 웹 전용 빌드, SPA 경로 rewrite, 서비스 워커 캐시 갱신 헤더
- [x] 웹 build 스크립트에 `node scripts/build-pwa.mjs` 추가; 라이브러리 의존성 추가 없음
- [x] manifest·설치 아이콘·정적 앱 파일 precache; Supabase 응답은 캐시하지 않음
- [x] 새 버전 대기 안내 및 사용자 선택 시 업데이트; 오프라인에서는 힌트 사용 방지
- [x] 웹 `tsc --noEmit`, `vite build`, `node scripts/build-pwa.mjs`, `node --check dist/sw.js` 통과
- [x] 빌드 manifest와 PNG 아이콘의 192/512px 크기 확인
- [ ] Vercel 프로젝트 연결·환경 변수 설정·실제 배포 및 런타임 검증
- 배포 설정과 기능 범위: `docs/vercel-pwa.md` 참고. 배포 주소마다 기기 학습 기록 저장소는 분리된다.


---

## Phase 5. Supabase backend integration and hint RPC (implementation complete; project verification pending)

- [x] Create `user_profiles` schema with RLS, anonymous-user profile creation, and secure hint RPCs.
- [x] Add typed Supabase client and data functions for reading balances, atomically consuming hints, and server-only ad rewards.
- [x] Connect the web app to persistent anonymous Supabase sessions and the server-side hint balance.
- [ ] Configure root `.env.local`, enable anonymous sign-ins, apply the migration, and verify against a real Supabase project.
- [x] Restrict ad reward grants to `service_role` and provide a data helper for a trusted server; ad-platform verification remains in Phases 6 and 7.

## 📌 Phase 6. Mobile 앱 구현 (`apps/mobile` - Ionic + Capacitor)
- [ ] `apps/web`에서 검증된 UI 패턴을 Ionic React 컴포넌트로 구현
- [ ] Capacitor 네이티브 설정 (Android/iOS)
- [ ] AdMob 보상형 동영상 광고 플러그인 연동 (광고 시청 -> 힌트 충전)
- [ ] 모바일 기기/에뮬레이터 동작 검증

---

## 📌 Phase 7. Toss 미니앱 구현 (`apps/toss` - Apps in Toss)
- [ ] `apps/toss` 스캐폴딩 (Granite CLI + Vite)
- [ ] TDS (Toss Design System) 컴포넌트로 UI 구현
- [ ] Toss SDK 연동 (사용자 인증, 토스 리워드 광고)
- [ ] Toss 샌드박스 환경 동작 검증
