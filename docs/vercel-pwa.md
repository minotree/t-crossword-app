# Vercel 웹/PWA 배포

## 프로젝트 설정

- 저장소 루트에서 배포한다. Root Directory는 `.`이며 `apps/web`로 바꾸지 않는다.
- Framework Preset: Vite
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @t-crossword/web build`
- Output Directory: `apps/web/dist`
- 라우트 새로고침 및 서비스 워커 캐시 정책은 루트 `vercel.json`에 정의되어 있다.

Vercel Environment Variables에 다음 공개 클라이언트 환경 변수를 설정한다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`.env.local` 파일을 업로드하지 않는다. Supabase service-role 키는 웹 빌드에 넣지 않는다.
Supabase 프로젝트의 익명 로그인 활성화와 기존 마이그레이션 적용·RLS 검증은 별도 준비가 필요하다.

## 동작 범위

- HTTPS에서 manifest와 192/512px PNG 아이콘으로 설치 정보를 제공한다.
- 빌드 마지막 단계가 파일 해시별 서비스 워커를 생성해 HTML·JS·CSS·아이콘·내장 단어장을 캐시한다.
- 첫 방문과 캐시 설치 완료에는 인터넷이 필요하다. 이후 오프라인에서 로컬 퍼즐·단어장·즐겨찾기·학습 기록을 이용할 수 있다.
- Supabase API 응답·토큰은 서비스 워커에 캐시하지 않는다. 힌트 조회·차감·신규 인증은 온라인 기능이다.
- 업데이트는 안내 버튼을 눌렀을 때 적용한다. 현재 퍼즐은 다시 생성되며 기기에 저장한 학습 기록은 유지한다.
- 기기 저장은 배포 주소(origin)별로 분리된다. localhost 또는 Preview 주소의 학습 기록은 Production 주소로 자동 이전되지 않는다.
- 브라우저별 설치 메뉴가 다르다. iOS는 Safari 공유 메뉴의 '홈 화면에 추가'를 이용한다.

## 배포 후 필수 검증

1. 홈·퀴즈·단어장·설정 직접 접근 및 새로고침.
2. manifest와 아이콘 HTTP 응답, 설치 후 독립 창 실행.
3. 정답 기록 후 종료·재실행, 재출제 제외 및 설정에서 초기화.
4. 서비스 워커 설치 완료 후 오프라인 재실행과 모든 로컬 화면 이동.
5. 오프라인에서 힌트 차감 방지, 연결 복구 후 인증·잔액 조회.
6. 새 버전 배포 시 업데이트 안내·명시적 적용 및 학습 기록 유지.

실제 배포 및 기기 검증은 아직 수행하지 않았다.
