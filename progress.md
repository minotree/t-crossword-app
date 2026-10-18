# 십자낱말 영단어 앱 (t-crossword-app) 구현 진행표

> 프로젝트 사양서(`crossword-project-spec.md`) 및 `AGENTS.md` 가이드라인에 따른 단계별 구현 현황입니다.  
> 완료된 항목은 `[x]`로 체크하여 관리합니다.

---

## 마무리 기록: API 안정화·배포·테스트 업로드 (2026-10-19)

- 요청 제한·바이트 단위 본문 상한·판 생성 UUID/DB 스냅샷 재사용·재시도 회귀 검사와 Edge 배포 소스를 정리했다. 운영 신규 SQL 적용·toss-hints v2 ACTIVE·최신 번들 테스트 업로드는 앞선 사용자 승인 범위에서 완료했다. 이번 마무리에서는 추가 배포·DB 변경·업로드를 하지 않는다.
- 기존 검증: API 46개·토스 46개, 전체 타입 검사, API Node/Edge 빌드, 토스 lint/build:ait 통과. 별도 로컬 CPU 108회/6요청 묶음과 실제 DB 롤백·권한/집계·원격 경계 요청 검사를 완료했다. 같은 코드 검사는 반복하지 않고 현재 문서·경로·diff·커밋 대상과 비밀 포함 여부, `git diff --check`를 확인한다. 일반 API 실행에서 프로파일 1개는 의도적으로 건너뛴다.
- AGENTS에 판 생성 재시도·적용 순서·키 등록/업로드 경계를 반영하고 구조·사양·앱 README·적용 문서를 맞췄다. 이 커밋은 API와 관련 소스·테스트·문서 범위다. 작업 시작 전부터 있던 그림책 원본/이미지·갤러리·콘텐츠 변환·앱 화면 수정은 포함하지 않고 그대로 보존한다. 로컬 키/인증서/설정·tmp·dist·.ait도 제외한다.
- 남은 검증은 사용자가 맡은 최신 토스 버전의 실제 사용·그림책·재시도와 실제 다중 DB 연결·Edge CPU/부하·월 호출량 소모 방어, 웹/PWA 기기/캐시 갱신이다. 기기 테스트를 많이 진행할 예정이라는 사용자 확인은 테스트 통과 결과로 간주하지 않는다. 진행 중 판은 앱 종료 후 복원하지 않는다. 공개 검토 요청·출시는 미실행이다.
- 현재 브랜치 main, 원격 origin/main으로 이번 범위만 커밋·일반 푸시한다. 커밋 해시와 푸시 결과·남은 작업 트리는 최종 보고에 기록한다.
- 스테이징 검사에서 처음 포함한 생성 Edge 번들의 의존성 주석 공백과 무료 운영 문서의 EOF 빈 줄을 발견했다. 번들은 Git 제외 대상으로 바꾸고 배포 전 `build:edge` 재생성을 명시했으며 문서 공백을 정리했다. 실행 코드는 변경하지 않았다. 최종 staged diff 검사를 기준으로 통과 여부를 확인한다.

## 토스 최신 번들 CLI 업로드 완료 (2026-10-19)

- 사용자 키 등록·업로드 승인 후 저장된 default 프로필로 `pnpm.cmd --filter @t-crossword/toss exec ait deploy --location ./t-crossword.ait --memo "판 생성 재시도와 요청 제한 적용, 그림책 61편 연결"`을 실행해 업로드 성공(exit 0)을 확인했다. 최초 샌드박스 요청은 fetch 실패였으며 권한 승인 후 재실행했다. 키 내용은 읽거나 출력하지 않았다.
- 업로드한 번들은 기존 최신 30,159,418바이트 `.ait`이며 재빌드하지 않았다. deploymentId: `01a15094-d600-75c6-b2eb-f48c4a049b1f`. CLI 테스트 실행 주소: `intoss-private://t-crossword?_deploymentId=01a15094-d600-75c6-b2eb-f48c4a049b1f&host=appsInTossHost`.
- 콘솔 테스트 업로드까지만 완료했다. 공개 검토 요청·출시·커밋·푸시 없음. 최신 번들의 실제 토스 인증·판 생성 재시도·새 판 발급·힌트/보상·그림책 가독성·페이지 이동은 기기 확인 대기다. 실제 다중 DB 연결·Edge CPU/부하도 별도 미검증이다. 문서 변경 후 `git diff --check` 통과.

## 토스 DB 적용·API v2 배포 (2026-10-19)

- 사용자의 진행 승인으로 기존 crossword 프로젝트(`zduyaejdjwfhsiazcmrn`)에 신규 `20261019_toss_round_idempotency.sql`만 직접 적용했다. 기존 SQL 재실행·DB 초기화·CLI migration history 등록은 하지 않았다. 적용 전후 지갑 1개·판 19개·힌트 합계 16개를 보존했고 새 스냅샷은 0행이다.
- 실제 DB에서 새 테이블 RLS 활성·anon/authenticated 접근 차단, 두 RPC의 PUBLIC/anon/authenticated 실행 차단·service_role 허용을 확인했다. 합성 사용자/세션/판으로 중복 저장·재인증·설정 불일치·힌트 10→9·완성 9→14·중복 정답 14 유지 검사를 한 트랜잭션에서 실행하고 ROLLBACK했다. `passed_rolled_back` 통과 후 기존 집계를 재확인했다. 재실행 SQL은 `scripts/verify-toss-round-{schema,rollback}.sql`에 보관했다.
- 기존 Supabase에 `toss-hints` 배포 성공, 함수 목록 **v2 ACTIVE**·기존 `verify_jwt: false` 유지 확인. Secrets·인증서·probe JWT·요금제 변경 없음. 인스턴스별 요청 제한과 판 생성 스냅샷 코드가 함께 배포됐다.
- 원격 검사 통과: health 200·무인증 balance 401·요청 UUID 포함 무효 세션 round 401·미허용 Origin 403·기존 허용 HTTPS Origin preflight 204. 첫 로컬 개발 Origin 검사는 403이었고 HTTPS Origin으로 재확인했다. 실제 사용자 인증을 우회한 API 판 생성은 하지 않았다.
- 최신 `apps/toss/t-crossword.ait` 30,159,418바이트 준비. CLI `ait deploy --help`를 확인했으며 저장 프로필 `~/.ait/credentials`가 없어 테스트 업로드는 실행하지 않았다. 사용자 키를 채팅으로 요청하거나 자격 증명을 변경하지 않았다.
- API/토스 README·무료 운영 문서·[적용 보고서](docs/toss-round-idempotency.md)를 실제 상태로 갱신했다. 동일 코드의 기존 로컬 검사/빌드는 반복하지 않았고 `git diff --check` 통과. 미실행: 최신 번들 실제 토스 인증·같은 판 재시도·새 판 발급·물리적 응답 유실·다중 DB 연결 경합·Edge CPU/부하. 콘솔 업로드·공개 검수·커밋·푸시 없음.

## 토스 판 생성 요청 멱등성 구현 (2026-10-19, 운영 미적용)

- 판 생성 응답 유실 후 같은 요청으로 새 판이 추가되던 문제에 요청 UUID 기반 경로를 추가했다. 토스 gateway는 동일 난이도·크기·정규화한 학습완료 목록의 실패 요청 ID를 유지하고, 정상 응답 검증 후 다음 판에는 새 ID를 발급한다. 설정 변경은 새 ID, 만료/불일치의 명시적 거부 후에는 다음 수동 요청에 새 ID를 쓴다. 자동 반복 요청·앱 종료 후 복원은 추가하지 않았다.
- API는 사용자별 요청 결과를 출제 전에 조회하고, 미저장 요청만 출제 후 신규 RPC로 저장한다. SQL은 지갑 행 잠금 후 재조회해 먼저 저장된 후보를 반환하며 판과 스냅샷을 한 트랜잭션에서 저장한다. 재인증 후에도 같은 사용자면 같은 판을 반환하며 현재 잔액을 조회한다. 다른 사용자와 설정을 격리하고 빈 결과도 저장한다. ID 없는 구버전 요청은 기존 비멱등 경로로 호환한다.
- 신규 마이그레이션 `20261019_toss_round_idempotency.sql`과 `packages/data` 서버 RPC/타입을 추가했다. 스냅샷 테이블 RLS·클라이언트 권한 차단·서버 전용 두 함수 권한을 설정했다. 운영 DB에는 적용하지 않았다. DB→API→토스 번들 순서의 별도 승인된 적용이 필요하며 [규칙·검증·적용 순서](docs/toss-round-idempotency.md)에 기록했다.
- 검증 통과: `pnpm.cmd typecheck` 전체; API `test` **46개**(프로파일 1개 의도적 건너뜀); 토스 `test` **46개**; API `build`·`build:edge`; 토스 `lint`·`build:ait`; `git diff --check`. 새 SQL의 세션 갱신·사용자 격리·불일치·만료·빈 결과·중첩 후보·실패 롤백·60판 한도 재조회·권한과 HTTP 응답 폐기 후 1회 저장을 검사했다. 토스는 ID 유지/변경·재인증·429를 검사했다. 빌드 61편/119장 대응 및 dist 31,818,542바이트(<100MB) 통과, 기존 큰 청크 경고 유지.
- 한계: 저장 전 동시 조회가 모두 실패하면 출제 CPU는 중복될 수 있으나 판/결과 저장은 하나로 확정한다. HTTP 요청 제한·함수 호출량은 재시도에도 소비된다. 스냅샷은 24시간 후 같은 UUID 재사용을 거부하며 자동 삭제는 없다. 일반 판 시간당 60개와 빈 결과 시간당 60개는 별도 한도다. 새 경로의 실제 Edge CPU·다중 연결 경합·Supabase 통신·기기 확인은 미실행이며 PGlite 단일 연결 검사와 구분한다.
- 운영 DB 적용·배포·토스 업로드·자격 증명 변경·커밋·푸시 없음. 기존 미커밋 작업은 보존했다.

## 토스 CPU·중복 요청·응답 유실 로컬 검증 (2026-10-19)

- 로컬 API/SQL 회귀 검사를 확장했다. 힌트 UUID 12개 중첩 제출·같은 위치의 서로 다른 UUID·잔액 1의 다른 단어 요청·최종 정답 12개 중첩 제출에서 각각 1회 차감/초과 거부/+5 한 번을 확인했다. PGlite 한 연결의 직렬 큐 결과이며 실제 PostgreSQL 다중 연결의 행 잠금 경합을 증명하지 않는다.
- Edge 경로 어댑터→핸들러→실제 마이그레이션 SQL 처리 뒤 응답을 폐기하고 같은 힌트/최종 정답을 재요청해 잔액 9/14가 유지됨을 확인했다. SQL 브리지 검사이며 실제 PostgREST·네트워크 단절 검증은 아니다. 토스 gateway의 동일 최종 정답 재요청·429 자동 재시도 없음·재인증 상한, UI의 확인 전 성공/학습 기록 반영 보류와 재시도 후 반영도 검사했다.
- 세 난이도×세 크기×학습완료 4비율×seed 3개로 실제 `/round` 핸들러를 108회 측정했다(DB 가짜 저장소). 로컬 Node CPU 중앙값 16ms·관측 95백분위 282ms·최대 485ms, 최대 경과 488.1ms. 별도 고급 12×12 6개 묶음 모두 200, 묶음 CPU 2,562ms·경과 2,559.9ms. 다른 자동 검사와 병행하지 않은 최종 측정과 원시 표본을 [검증 보고서](docs/toss-api-local-verification.md)에 보관했다. hosted Edge CPU 한도 검증과 구분하며 생성 알고리즘은 변경하지 않았다.
- 현재 제한도 회귀 검사로 기록했다. `/round` 생성 응답을 잃고 재시도하면 새 UUID로 두 판이 등록된다. 직접 힌트 차감은 없지만 생성 작업·판 저장·생성 횟수를 다시 소비한다. 판 생성의 멱등성은 미구현이다.
- 검증: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api test` **33개 통과·프로파일 1개 의도적 건너뜀**, `pnpm.cmd --filter @t-crossword/toss test` **41개 통과**, API·토스 `typecheck` 통과. `$env:TOSS_PROFILE='1'`로 API `exec vitest run tests/puzzleProfile.test.ts` 별도 **1개 통과**, `git diff --check` 통과. 실행 코드·SQL·설정·의존성 변경이 없어 빌드는 반복하지 않았다.
- 미실행: 실제 Edge CPU/부하·Supabase 다중 연결 경합·물리적 네트워크 응답 유실·토스 기기 확인. psql/pg_ctl/Docker는 명령 경로에 없으며 설치하지 않았다. 원격 요청·배포·운영 DB/자격 증명 변경·커밋·푸시 없음. 다음은 승인된 테스트 환경에서 원격 CPU·동시성·재시도를 확인하는 단계이며 무료 호출량 자체의 소모 차단은 여전히 미완료다.

## 토스 API 인스턴스별 요청 제한 (2026-10-19)

- 공통 핸들러에서 전체 POST 600회/60초, 인증 교환 합계 20회/60초, 세션 해시별 전체 120회/60초 및 판 생성 6회·힌트 30회·잔액/정답 각각 90회/60초 제한을 추가했다. 외부 호출 전 429·한국어 대기 안내·Retry-After를 반환한다. 원본 토큰/IP는 저장하지 않고 최대 4,096개의 카운터만 보관하며 만료 후 회수한다. 잘못된 입력·재시도도 횟수에 포함된다.
- 본문 크기는 문자열 길이 대신 실제 UTF-8 스트림 65,536바이트로 제한하고 미등록 경로는 본문 처리 전에 거부한다. 새 의존성·DB 변경·앱 UI 변경 없음. 기존 작업 트리 변경을 보존했다.
- 환경: Node v24.22.0, pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api test` **27개 통과**, `pnpm.cmd --filter @t-crossword/toss-api typecheck` 통과. 실행 코드 수정 후 API `build`·`build:edge` 통과(Node 약 1.84MB, Edge 약 1.83MB). 후속 변경은 회귀 테스트와 문서만이며 타입 검사를 다시 통과했다. `git diff --check` 통과. 인증 동시 요청/기간 만료·세션 격리·토큰 교체 전체 제한·퍼즐/세션 합산 한도·카운터 용량·초과 스트림 취소를 검사했다.
- API README와 무료 운영 문서에 수치·신뢰 경계·한계를 기록했다. Supabase 공식 호출량 문서상 429도 호출량에 집계된다. 이번 제한은 worker별 후속 작업 방어이며 **월 무료 호출량 소모 차단·다중 worker 전체 제한은 미완료**다. 재기동 시 초기화되고 인증 전체 한도는 정상 사용자에게도 공유된다.
- 미실행: 원격 함수 배포·실제 Edge CPU/부하·다중 연결 동시성·서버 처리 후 응답 유실 재시도·토스 기기 검증. 운영 DB·자격 증명 변경·커밋·푸시 없음. 다음 우선 검증은 퍼즐 생성 CPU와 DB 중복/동시 요청·응답 유실 재시도이며, 호출량 자체 보호에는 함수 진입 전 차단/직접 주소 우회 방지의 별도 검토가 필요하다.

## 마무리 기록 (2026-10-19)

- Supabase Edge 직접 연결·인증 시험 경로와 정답 모달 축소, 그림책 전체 검토·교정·토스 61편/119장 연결을 정리했다. Docker 구성은 미배포 참고용으로 보존한다. 공통 도메인 경계와 플랫폼별 UI 분리를 유지한다. `AGENTS.md`의 무료 운영·그림책 생성/승인 해시 규칙 및 관련 구조·사양·README·검토 문서를 현재 상태에 맞췄다.
- 사용자 확인: Supabase 직접 연결에서 기존 잔액·출제·힌트 차감·완성 보상 +5, 수정한 정답 모달 정상 동작. 실제 기기에서 가로 자동 회전은 되지 않았으며 정책상 금지라고 확정하지 않는다. 세로 화면 기준으로 확인을 진행한다.
- 사용자 Usage 화면 확인: 조직 전체 Free 플랜, 집계 2026-10-17~11-17, Edge Function Invocations 29/500,000회, DB 0.027/0.5GB, egress 0.002/5GB, storage 0.006/1GB, MAU 1/50,000, 한도 초과 없음. 직접 계정 접속 결과나 향후 비용 보장이 아니다. 아래 과거 ‘계정 무료 상태/사용량 미확인’ 기록을 대체한다.
- 이미 실행한 검증: API 테스트 20개·Node/Edge 빌드·전체 타입 검사, 토스 테스트 37개·lint·build:ait, 웹 테스트 38개·lint·build, 어휘 회귀 3개, 토스 콘텐츠 회귀 5개, 웹 빌드/PWA 검사 3개, 세 난이도 콘텐츠 검사·갤러리·웹/토스 이미지 변환 통과. 동일 코드 검사를 이번 마무리에서 불필요하게 반복하지 않았다. 이번 마무리에서는 diff·비밀 정보 포함 여부·스테이징 범위와 `git diff --check`를 확인한다.
- 최신 `.ait`는 30,159,334바이트, 압축 해제 31,820,241바이트, 그림책 119장이다. 원본·보정 이력·토스 WebP와 승인 해시를 배포 소스에 포함하며 로컬 환경 파일·인증서·키·임시 도구는 커밋에서 제외한다. 검토 범위·한계는 콘텐츠 최종 보고서를 따른다.
- 남은 작업: API 요청 제한·무료 호출량 소모 방어, 퍼즐 생성 CPU/부하, 실제 중복·동시 요청과 서버 처리 후 응답 유실 재시도 검증. 최신 그림책 토스 업로드·작은 화면 가독성·페이지 이동·해석·뒤로가기·이미지 재시도, 웹/PWA 기기·캐시 갱신은 미실행이다. 기존 큰 청크 경고 유지. 이번 마무리는 추가 배포·운영 DB 변경·자격 증명 변경을 포함하지 않는다.

## 그림책 전체 검토·토스 연결 완료 (2026-10-19)

- 전체 61편·119장의 영어·해석과 카드 제목·본문·페이지 번호·인물 역할을 대조하고 제작 기록·자체 참조 파일·도구 이용 조건을 검토했다. 초급 32편의 `work with you`를 `work with me`로 추가 교정하고 ImageGen 보정본·해석·제작 기록·웹 데이터를 맞췄다. 본문 초급 기본 어휘는 536종 유지. 이전 문서의 ‘토스 승인 작품 0편’은 과거 이력이다.
- [최종 검토 범위와 한계](content/picture-book-final-review-2026-10-19.md)를 기록하고 61편을 `approved`로 변경했다. 법률 의견·비침해 보증이나 실기기 검증을 뜻하지 않는다. `content/picture-book-approval.json`에 작품별 텍스트·이미지 해시를 보관하며 승인 후 내용이 바뀌면 빌드가 실패한다. 기존 제작 기록·PNG·보정 이력은 보존했다.
- 토스에서 초급 45편·중급 9편·고급 7편, 총 119장을 제공하도록 토스 전용 JSON·WebP를 생성했다. 원본 약 292.9MiB에서 토스 WebP 약 28.0MiB로 준비했다. 다른 앱의 UI·데이터·자산을 가져오지 않는다. 일반 빌드는 Node만 사용하며 Python/Pillow는 콘텐츠 제작 단계에만 필요하다. 승인·PNG/WebP 해시와 목록 밖 파일 검사를 유지했다.
- 검증 통과: `node --test scripts/check-toss-picture-books.mjs` 5개; `pnpm.cmd --filter @t-crossword/toss test` 37개; 토스 `lint`, `build:ait`(타입 검사·119장 dist 이미지 해시·전체 dist 100MB 상한 포함); 웹 `build`(타입 검사/PWA 포함); 초급 `build-gallery.py`, 중·고급 `build-preview.py`와 웹/토스 이미지 변환. Python 명령은 `tmp/picture-book-python/Scripts/python.exe -B`를 사용했으며 세부 명령은 최종 보고서에 기록했다. `git diff --check` 통과. 기존 큰 JS 청크 경고 유지.
- 최신 파일: `apps/toss/t-crossword.ait` **30,159,334바이트**, ZIP 압축 해제 합계 **31,820,241바이트**, WebP **119개**. 실제 ZIP 파일도 열어 개수와 100,000,000바이트 이내를 확인했다. dist는 31,818,214바이트다. 업로드·검수 요청·운영 배포·DB 변경·커밋·푸시는 실행하지 않았다.
- 남은 사용자 기기 검증: 최신 번들을 토스 콘솔 테스트에 올린 뒤 그림책 난이도별 목록·작품 읽기·페이지 이동·해석·뒤로가기·작은 화면 글자·이미지 실패 재시도를 확인한다. 이 콘텐츠의 전체 외부 작품 전수 대조나 독점적 권리 보증은 하지 않으며 앱 공개 책임 주체 표기는 출시 시 확인한다.

## 그림책 편집 검토 (2026-10-19)

- 후속 수정 완료: 초급 14편의 영어·해석과 고급 제목·해석·미스터리 6장/SF 8장을 교정했다. `copied → copy`로 분석되도록 접미사 규칙을 수정하고 `entitled → entity` 오인정을 막았다. 초급 문법어·복수형은 별도 보고하며 본문 기본 어휘는 536종이다. 기존 어휘 데이터 난이도는 변경하지 않았다.
- 내장 ImageGen으로 현재 사용하는 카드 16장의 본문을 보정하고 각각 시각 대조했다. 원본·중간 버전·실제 생성 프롬프트를 보존하며, SF 형제 관계 오류는 별도 정정 기록을 추가했다. 갤러리·어휘 보고서·웹 JSON·WebP를 재생성했다. `draft-unreviewed`와 토스 승인 작품 0편은 유지한다.
- 후속 검증: 임시 Python 3.15/Pillow 13 환경에서 초급 `build-gallery.py`, 중·고급 `build-preview.py`(어휘 검사 포함), `prepare-picture-books.py` 통과. `content/test-vocabulary-audit.py` 회귀 검사 3개, 웹 lint·build(타입 검사 포함), 웹 테스트 38개, `node --test apps/web/scripts/check-build.mjs` 3개 통과. 119장 원본/웹 대응·public/dist 바이트 일치·변경 16장 PNG→WebP 재변환 일치 확인. `git diff --check` 통과. 실제 기기·캐시 갱신·권리 검토는 미실행/미완료이며 기존 큰 청크 경고 유지. 상세 실제 명령은 검토 보고서에 기록했다. 아래 항목은 최초 검토 당시 이력이다.

- 초급 45편·중급 9편·고급 7편, 총 119장의 영어 원문·해석을 읽고 [작품별 검토 보고서](content/picture-book-review-2026-10-19.md)를 작성했다. 초급의 부자연스러운 문장·단복수, 번역 대응, 고급 해석 조사 오타와 SF 인물 보정 기록의 누나/여동생 불일치를 기록했다.
- 기존 어휘 보고서에서 `copied → cop`, `entitled → entity`의 의미상 잘못된 연결을 발견했다. 올바른 기본형·허용 정책을 확인하고 검사기를 고친 뒤 재검사가 필요하다. 콘텐츠·어휘 데이터·이미지·승인 상태는 변경하지 않았다.
- Node 읽기 전용 확인: 원본 119장의 텍스트·해석·페이지 제목과 웹 JSON 일치, 원본 PNG·웹 WebP 존재, 제작 기록 경로 대응 확인. 초급 본문 어휘 537종 및 제목·본문 초급 범위 확인. 이미지 픽셀·변환 최신성 검사는 아니다.
- 시각 확인은 초급·중급 전체 축소 모음과 고급 법정 9·10장 모음, 고급 SF 5장 및 중급 SF 4장 원본에 한정했다. 전체 119장 글자별 재대조·실기기 가독성은 미완료다. Python/py 실행 별칭 접근 오류로 기존 Python 검사·갤러리·웹 변환은 미실행이며 재설치는 하지 않았다.
- OpenAI 이용약관·공유 정책을 다시 확인했으나 제작 계정 계약·기존 어휘 데이터 권한·이미지 글꼴·외부 작품 유사성은 미확인이다. 원본 `draft-unreviewed` 및 토스 승인 작품 0편을 유지한다. 웹 변환기는 미승인 작품도 포함하므로 웹 배포 전 콘텐츠 제공 정책 점검이 필요하다. 문서 변경 후 `git diff --check` 통과. 커밋·푸시·배포 없음.

## 추가 작업 기록 (2026-10-19): 토스 전체 힌트 API의 Supabase 직접 연결

- 사용자 실제 토스 확인: Supabase 직접 연결의 기존 잔액 13개 유지·퍼즐 생성·힌트 1개 차감·완성 보상 +5가 모두 정상 동작한다고 확인했다. 기존 인증 probe 결과와 구분해 전체 Edge 경로 검증으로 기록한다. CPU 여유·부하·동시성·통신 실패 재시도와 계정 무료 사용량은 여전히 별도 확인 대상이다.
- 후속 UI: 사용자 화면에서 오답 안내로 정답 모달이 커지는 문제를 확인해 안내를 남은 횟수와 초기화/소진 후 입력 가능의 두 문장으로 줄이고 입력 칸 위아래 여백·안내 행간을 축소했다. 오답 표시 한도·입력·제출 규칙은 유지한다. 실제 iOS 키보드 상태의 최종 높이는 새 번들로 재확인이 필요하다.
- 모달 축소 검증: `pnpm.cmd --filter @t-crossword/toss test` 35개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사 포함), `git diff --check` 통과. 새 `.ait` 생성 완료·토스 업로드 미실행, 큰 청크 경고 유지.
- 사용자 제공 실제 토스 화면에서 인증 전용 probe 성공을 확인했다. 이어 기존 핸들러·지갑 RPC를 재사용하는 Edge 진입점과 경로 어댑터·번들 빌드를 추가하고 기존 프로젝트에 `toss-hints` v1 ACTIVE 배포를 완료했다. DB 마이그레이션·잔액 변경·유료 전환은 하지 않았다.
- 토스 전용 세션을 처리하므로 함수의 Supabase JWT 검증은 끄고 앱 내부의 mTLS 인증·세션 해시·DB 만료·소유권 검증을 유지한다. probe는 JWT 검증 유지. 기존 HTTPS 허용 Origin을 Secrets로 등록하고 인증서 Secrets는 재사용했다. 실제 비밀은 번들에 넣지 않는다.
- 무시되는 토스 API 주소를 Supabase 직접 주소로 바꾸고 임시 인증 시험 버튼을 비활성화해 최신 `.ait`를 만들었다. PC·터널을 호출하지 않는 새 번들이며 콘솔 업로드·기기 확인은 대기다. 기존 시험 프로세스는 임의 종료하지 않았다.
- 검증: `pnpm.cmd --filter @t-crossword/toss-api test` 20개, API `build:edge`·`build`, `pnpm.cmd typecheck` 전체, 토스 `lint`·`build:ait` 통과. Edge 번들 약 1.83MB, 토스 큰 청크 경고 유지. 원격 health 200/preflight 204/무인증 지갑 요청 401/무효 토스 코드 401/미허용 Origin 403/임의 토큰의 실제 DB 검증 401 확인. `git diff --check` 통과.
- 미검증: 새 Edge 경로의 실제 사용자 잔액·퍼즐 생성 CPU 제한·차감·보상·재시도·동시성, 계정 무료 플랜과 조직 누적 사용량. 무료 호출량 소모 방어·요청 제한은 남은 항목이다. 기존 Node 검증과 구분한다. 커밋·푸시·토스 업로드 없음. 최신 구성은 [무료 출시 문서](docs/toss-free-hosting.md)를 따른다.

## 방향 변경 기록 (2026-10-19): 무료·별도 서버 관리 없는 토스 출시

- 실제 코드 시험 준비: 토스 설정에 시험 빌드 전용 `무료 인증 연결 확인` 버튼과 로컬 `/auth-probe` 중계를 추가했다. SDK가 발급한 코드만 전송하고 비밀 키는 API에만 보관한다. 시험 경로는 명시적 설정·허용 Origin을 요구하며 DB·지갑 호출 없이 성공 여부만 반환한다. PC API와 임시 HTTPS 터널을 시작하고 새 주소를 무시되는 앱 설정에 반영해 `.ait`를 재생성했다. 토스 콘솔 업로드와 실제 버튼 확인은 사용자 진행 대기다. 정식 출시 구성으로 사용하지 않는다.
- 이번 자동 검사: API `build`(타입 검사 포함)·`test` 16개, 토스 `lint`·`build:ait`(타입 검사 포함)·`test` 35개 통과. `git diff --check` 통과. 토스 큰 청크 경고 유지. 인증 코드·키·토큰 출력/앱 번들 포함 없음. Supabase 함수 자체의 추가 배포·DB 변경·커밋·푸시는 하지 않았다.
- 사용자 CLI 로그인 후 승인된 시험 함수 배포 완료: 기존 crossword 프로젝트에 `toss-mtls-probe` v1 ACTIVE, `verify_jwt: true` 확인. 인증서·키·시험 토큰 3개를 Secrets에 등록했다. 토큰 없는 요청은 401, 무효 코드 시험은 함수 502 / 토스 응답 200 / `authenticated: false`를 반환해 hosted mTLS 클라이언트 생성·외부 응답 수신을 확인했다. 실제 유효 코드 인증 성공과 전체 API 이전은 아직 미검증이다. DB·잔액·기존 앱 연결 변경, 유료 전환·결제·커밋·푸시 없음. 임시 등록 파일에서 중복 인증서·키를 제거하고 무시되는 probe 토큰만 보관했다. CLI `.temp`를 Git에서 제외하고 `git diff --check` 통과.
- 후속 배포 준비(사용자 승인 후): Supabase CLI 2.121.0 임시 실행 성공. 기존 인증서·키를 비밀 출력 없이 검사해 일치·현재 유효·PKCS#8 비암호화 형식을 확인했다. `npx.cmd --yes supabase projects list`는 `AccessTokenRequiredError`로 실패해 배포 계정 로그인이 필요하다. 함수 배포와 Secrets 등록은 아직 실행하지 않았으며 키·인증서를 전송하지 않았다. 사용자가 로컬 터미널에서 `npx.cmd --yes supabase login`을 완료하면 승인된 시험 배포를 이어간다. DB·잔액·기존 앱 연결 변경 없음.
- 사용자 확정 기준을 AGENTS.md에 반영했다. 유료 Node 호스팅·Docker 운영 방향을 중단하고 기존 Supabase Edge Functions를 우선 검토한다. Docker 파일은 참고용으로 보존하며 설치나 배포를 요구하지 않는다.
- Deno 공식 mTLS 지원과 Supabase Free 월 함수 50만 회를 확인했다. 실제 Supabase 런타임 장애 보고도 있어 지원 확정과 구분했다. 기존 퍼즐 생성의 Edge CPU 2초 제한·번들·계정 전체 무료 사용량도 검증해야 한다.
- DB·잔액에 접근하지 않는 인증 전용 `supabase/functions/toss-mtls-probe/index.ts`를 준비했다. 게이트웨이 JWT와 추가 probe 토큰으로 제한하고 원문·식별키·비밀을 반환하지 않는다. [근거·시험 절차](docs/toss-free-hosting.md)에 확인 범위와 한계를 기록했다.
- 검증: 문서·소스 검토 및 `git diff --check` 통과. Deno·Supabase CLI가 명령 경로에 없어 Deno 타입 검사·런타임 실행은 미실행이다. 배포·Secrets 등록·실제 mTLS 교환·계정 무료 상태 확인·API 전환·커밋·푸시는 실행하지 않았다. 기존 사용자 설정과 작동 중인 Node 연결은 유지했다.

## 추가 작업 기록 (2026-10-19): 토스 API Docker 배포 준비

- 사용자 선택에 따라 업체에 종속되지 않는 Node 24 다단계 Dockerfile과 전용 허용 목록 방식의 dockerignore를 추가했다. 실행 이미지는 빌드 번들만 포함하고 node 사용자로 실행한다. 인증서·키·환경 파일은 빌드에서 제외하고 실행 시 비공개 설정/읽기 전용 마운트로 전달한다.
- API에 외부 호출 없는 `GET /healthz`와 SIGTERM/SIGINT 종료 처리를 추가했다. 진행 중 요청에 최대 15초를 주고 종료한다. 상태 확인은 DB·인증서 유효성 검사가 아니다.
- [배포 준비 문서](docs/toss-api-deployment.md)에 빌드·실행 예시, 비밀 설정·권한, HTTPS/요청 제한, 배포 승인·실기기 검증·복구 절차를 기록했다. 기존 임시 터널·로컬 비밀 설정은 변경하지 않았다.
- 검증: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd --filter @t-crossword/toss-api build`(타입 검사 포함) 및 `pnpm.cmd --filter @t-crossword/toss-api test` 14개 통과. `git diff --check` 통과. 새 의존성·lockfile 변경 없음.
- 미검증: Docker 명령이 현재 PC 경로에 없어 이미지 빌드·컨테이너 실행과 종료 신호 검증을 실행하지 못했다. Linux 번들 단독 실행·인증서 마운트 권한·호스팅 HTTPS/프록시 요청 제한·실제 기기 통합 검증이 남아 있다. 호스팅 선택·배포·DB 변경·커밋·푸시는 수행하지 않았다.

## 마무리 기록 (2026-10-18): 토스 앱·힌트 API와 고정 힌트 제목

- 토스 독립 React 18/TDS 앱과 Node 24 mTLS 인증 API, 공통 DTO·퍼즐 응답 검증·서버 전용 데이터 저장소, 토스 전용 지갑 마이그레이션을 정리했다. 웹·토스는 가로/세로 제목·진행 숫자를 고정하고 2열 문제 목록만 스크롤한다. 앱 UI·라우팅은 공유하지 않는다.
- 사용자 확인 기록: SQL Editor 적용, 실제 토스 인증·잔액 조회·힌트 10→9 차감·완성 보상 9→14, 오답노트 등록/숨김·학습 기록 보존. 이번 마무리에서는 기기 검증이나 DB 변경을 추가 실행하지 않았다. 아래 단계별 과거 미구현·미검증 기록보다 이 최신 상태와 앱 README를 우선한다.
- 문서: AGENTS.md의 화면·플랫폼 경계 규칙을 반영하고 구조·제품 사양·웹 보상 문서·토스 README의 현재 구현과 검증 범위를 맞췄다. 콘텐츠 원본은 변경하지 않았다. 토스 그림책은 승인된 작품 0편, 검토 대기 61편을 제외한다.
- 환경: Node v24.22.0 / pnpm 10.34.7. `pnpm.cmd typecheck`, `pnpm.cmd lint` 통과. `pnpm.cmd --filter @t-crossword/core test` 21개, `pnpm.cmd --filter @t-crossword/toss test` 33개, `pnpm.cmd --filter @t-crossword/toss-api test` 13개 통과. 웹은 apps/web에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 38개 통과.
- 빌드: `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss-api build` 통과. `node --test apps/web/scripts/check-build.mjs` 3개, `pnpm.cmd install --lockfile-only --frozen-lockfile --offline`, `git diff --check` 통과. 의존성을 재설치하지 않았다. 웹·토스의 500kB 초과 청크 경고는 남아 있다.
- 루트 `pnpm.cmd test`는 기존 packages/utils에 테스트 파일이 없어 실패했다. 관련 core·토스·API·웹 검사는 위 개별 명령으로 모두 통과했으며 루트 전체 테스트 성공으로 기록하지 않는다.
- 남은 작업: 상시 HTTPS API 호스팅·프록시 요청 제한·모니터링·세션/판 보관 정책, 실제 DB 동시성·통신 실패 재시도, 완전 종료 후 저장 기록·가로 회전·키보드·Safe Area·접근성 추가 검증, 그림책 편집·권리 검토와 광고 보상. 모바일 네이티브 검증·별도 배포·토스 업로드는 실행하지 않았다. 임시 터널 API 주소는 빌드 시 포함되므로 운영 전 주소 변경·재빌드가 필요하다.
- 커밋·일반 푸시 결과는 최종 보고에 기록한다. 비밀 환경변수·인증서·빌드 산출물은 커밋에서 제외한다.

## 추가 작업 기록 (2026-10-18): 퀴즈 배치·오답노트 삭제·완성 보상

- [x] 세로 화면은 그리드 위·힌트 아래, 가로 화면은 그리드 왼쪽·힌트 오른쪽으로 배치한다. 퀴즈 화면 높이를 하단 메뉴 위 공간에 맞추고 힌트 영역만 스크롤한다. 방향은 CSS 화면 너비·높이로 판단한다.
- [x] 오답노트에 단어별 삭제 버튼 추가. 숨김 목록을 로컬 저장하며 단어·힌트 사용 이력·즐겨찾기·학습완료 기록을 보존한다. 같은 단어에 다시 힌트를 사용하면 복귀하고 학습완료 초기화 후에도 숨김 상태를 유지한다. 기존 저장 데이터 호환·유효성 검사 포함.
- [x] 오답 붉은색 표시 횟수를 글자 수 × 2회에서 글자 수만큼으로 변경하고 안내 문구를 맞춘다. 창을 다시 열면 초기화되며 소진 후 입력·제출을 계속 허용한다.
- [x] 한 판 완성 시 현재 잔액에 힌트 5개를 추가하는 RPC·게임 훅 연결과 완료 팝업 지급 상태·실패 재시도 UI 구현. 퀴즈 화면에도 완성 보상 안내 추가. 마지막 글자를 힌트로 완성한 경우도 포함한다.
- [x] 서버 지급 기록은 사용자·판 UUID 조합으로 중복 방지하고, 고정 5개 증가와 기록을 한 트랜잭션으로 처리한다. 인증 사용자 자신의 잔액만 갱신하며 광고 보상 RPC 권한은 유지한다. 신규 마이그레이션은 파일만 준비했다.
- [x] `AGENTS.md`, 제품 사양서, PWA 검증 항목과 [완성 보상 문서](docs/puzzle-completion-rewards.md)를 현재 동작에 맞춰 정리한다. 구조 변경이 없어 `PROJECT_STRUCTURE.md`는 유지한다. 그림책 제작 문서는 관련 변경이 없어 유지한다.
- 검증: Node `v24.22.0`, pnpm `10.34.7`; `pnpm.cmd typecheck` 전체 워크스페이스 통과. `pnpm.cmd --filter @t-crossword/web build`, `pnpm.cmd --filter @t-crossword/web lint`, `pnpm.cmd --filter @t-crossword/web typecheck` 통과. 마무리 단계에서 마지막 보상 안내 문구까지 포함해 웹 빌드를 통과했고 `node --test apps/web/scripts/check-build.mjs`의 번들·PWA 캐시 검사 3개도 통과했다. 빌드의 500kB 초과 청크 경고는 남아 있다. 의존성 변경·재설치 없음.
- 웹 테스트: `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`, 6개 파일·38개 테스트 통과. 오답노트 기록 보존·재표시와 보상 요청·실패·완료 안내 테스트를 포함한다. 이 테스트는 실제 서버의 중복 지급·동시성 검증을 대신하지 않는다.
- 미실행: 운영 DB 마이그레이션 적용·실제 Supabase RPC/RLS/동시성 통합 검증, 브라우저·스마트폰·태블릿의 화면 회전·스크롤·입력 상호작용, 모바일·Toss 런타임 및 별도 배포. DB 적용 전 보상 지급은 활성화되지 않는다. `psql`·Supabase CLI·Docker가 현재 명령 경로에 없어 로컬 DB 실행 검증도 수행하지 못했다.
- 남은 제한: 완성 판정은 브라우저를 신뢰하므로 변조 앱의 새 UUID 허위 완성 요청은 막지 못한다. 화면 이탈·새로고침 후 보상 요청을 자동 복원하는 영속 대기열은 없다. 서버 판정이 필요한 범위와 배포 전 확인 사항은 보상 문서에 기록했다.
- 마무리 검사: 문서·diff 검토 및 `git diff --check` 통과. 커밋·일반 푸시 결과는 최종 보고에 기록한다.

## 추가 작업 기록 (2026-10-16): 입력 모달·오답노트 및 마무리 절차

- [x] 모달별 오답 붉은색 표시 한도: 글자 수 × 2회. 오답 영문 입력만 차감하고 정답 입력·삭제는 제외한다. 소진 후 입력·제출은 계속 가능하며 재실행 시 초기화한다.
- [x] 남은 오답 표시 횟수와 사용 안내를 모달에 표시한다.
- [x] 힌트 사용 후 기존 입력을 덮어쓰던 동작을 수정한다. 첫 번째 빈 셀에만 글자를 공개하고 빈 셀이 없으면 차감 없이 안내한다. 응답 대기 중 입력·제출을 차단한다.
- [x] 단어장 학습완료 옆에 오답노트 탭 추가. 힌트 차감 성공 시 단어 ID를 중복 없이 로컬 저장하고, 정답을 맞히거나 학습완료 기록을 초기화해도 보존한다.
- [x] 기존 저장 데이터 호환, 중복 방지·복원·초기화 시 보존, 잘못된 기록 검사 테스트 추가. 기존 학습완료·즐겨찾기 기록 유지.
- [x] `AGENTS.md`에 `마무리하자` 명령의 관련 문서 정리·검증·커밋·푸시 절차와 승인 범위를 기록한다.
- 검증: `pnpm --filter @t-crossword/web typecheck`, `pnpm --filter @t-crossword/web lint`, `pnpm --filter @t-crossword/web build` 통과. 기존 로컬 Node 22.23.3/pnpm 실행 파일로 호출했으며 의존성을 재설치하거나 프로젝트 필수 경로로 설정하지 않았다. 실행 시 `--config.verifyDepsBeforeRun=false`를 일회성 적용했다.
- 웹 테스트: `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests` 실행, 5개 파일·32개 테스트 통과. 추가 문서 변경 후 `git diff --check` 확인. 빌드에는 500kB 초과 청크 경고가 남아 있다.
- 미검증: 사용자가 담당하는 실제 브라우저·아이패드·스마트폰 동작, 모달 상호작용과 온라인 힌트 차감 통합 동작. 이번 변경에 대한 모바일·Toss 런타임 검증은 수행하지 않았다.
- 범위: 오답노트는 이 기기·브라우저에만 저장하며 변경 전 힌트 사용 이력을 소급 복원하지 않는다. 별도 추가된 `깔끔한 크로스워드 퍼즐 아이콘.png`는 이번 작업 커밋에서 제외한다.

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

개발 순서: **웹의 모든 기능 구현·검증 → 토스 미니앱 → 하이브리드 앱**. 플랫폼별 UI·라우팅·인증·저장은 분리하고, 퍼즐과 학습 관련 공통 규칙은 공유 패키지에서 관리한다.

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
  - 이후 고급 그림책 추가까지 웹 lint·타입 검사·빌드를 재실행해 통과했다(아래 그림책 검증 이력 참고).
  - 빌드에서 500kB 초과 청크 경고 발생; 번들 최적화 미완료
- [x] `apps/mobile` 타입 검사: 이전 공유 생성기 변경 시 통과; 이후 변경의 최신 검증은 미실행
- [x] 웹 ESLint 설치·flat config 구성 및 고급 그림책 추가 후 lint 통과 (`docs/lint.md` 참고)
- [ ] 실제 브라우저 및 스마트폰·태블릿에서 레이아웃·모달·하단 메뉴·저장·초기화 검증
- [x] PWA manifest·192/512px 아이콘·빌드 해시별 서비스 워커·업데이트 안내 구현
- [x] 오프라인 로컬 퍼즐·단어장·학습 기록 사용 경로 및 온라인 전용 힌트 안내 구현
- [ ] PWA 설치·오프라인 재실행·업데이트 실제 브라우저/기기 검증
- [ ] 웹 광고 시청·보상 검증 및 힌트 충전 UI 연결
- [ ] 모바일·토스 UI, 기기 저장 및 인증 어댑터 구현 (웹 연결 완료; 토스 저장·1차 UI는 구현했으며 실제 토스 저장·인증과 모바일 연결은 미검증/미완료)

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

### 그림책 콘텐츠와 읽기 화면

- [x] 하단 `그림책` 메뉴, 초급·중급·고급 선택 및 작품별 한글 해석 연결
- [x] 초급 동시·삽화 45편, 본문에서 초급 단어 537종 사용
- [x] 중·고등학생용 중급 9편·36장: 시·창작 에세이·소설 각 3편 (소설: SF·무협·환생 각 8장)
- [x] 성인용 고급 7편·38장의 영어 원문·한글 해석 작성: 시 2편(각 1장), 에세이 2편(각 3장), SF·현실 미스터리·법정 드라마 소설 각 1편(각 10장)
- [x] 고급 삽화 38장 제작·원문 대조·웹용 변환과 최종 연결 검증 (누적 웹용 이미지 119장)
- [x] 다중 페이지 이전·다음·목록 복귀, 페이지별 해석과 직접 접근 URL 연결
- [x] 난이도별 누적 어휘와 명시된 기본 문법어·활용형·파생형 검사 및 제작 기록 작성 (고급: 기본 어휘 594종, 고급 목록 135종 포함)
- [x] 고급 추가 후 웹 lint·typecheck·build, 웹 테스트 20개, 고급 원본·제작 기록·웹 JSON·빌드 이미지 대조, 서비스 워커 문법 검사 통과
  - 기존 500kB 초과 번들 경고는 남아 있음. 브라우저·기기 검증과 배포 전 편집·권리 검토는 별도.
- [ ] 실제 브라우저·기기에서 읽기·페이지 이동·오프라인 이미지 동작 검증 (사용자 확인 예정)
- [ ] 배포 전 콘텐츠 편집·권리 검토
- 콘텐츠와 검수 자료: `content/beginner-poems/`, `content/intermediate-readings/`, `content/advanced-readings/`. 웹용 이미지·목록 갱신: `python scripts/prepare-picture-books.py`.

### 초기 JavaScript 번들 최적화 (2026-10-16)

- [x] 홈을 제외한 퀴즈·단어장·그림책·설정을 경로별 동적 import로 분리하고 로딩·실패 안내 추가
- [x] 그림책 데이터와 공통 단어 데이터를 초기 홈의 정적 의존성에서 분리 (도메인 패키지 API 변경 없음)
- [x] 서비스 워커 등록을 페이지 load 이후 유휴 시간으로 지연; 분리된 JS는 설치 캐시에 포함해 기존 오프라인 메뉴 범위 유지
- 빌드 비교: 초기 JS 1,750.99kB → 557.27kB (약 68% 감소), Vite gzip 표시 491.88kB → 164.78kB. 전체 배포 용량과 설치 캐시 다운로드 총량을 줄인 수치는 아니다.
- [x] 웹 `lint`·`typecheck`·`build` 통과. 기존 로컬 pnpm 실행기에 `--config.verifyDepsBeforeRun=false --filter @t-crossword/web`를 지정해 각각 실행했다.
- [x] `apps/web`에서 `node ../../packages/core/node_modules/vitest/vitest.mjs run tests`: 웹 테스트 29개 통과
- [x] 루트에서 `node --test apps/web/scripts/check-build.mjs`: 초기 정적 의존성·메뉴 precache·오프라인 JS 응답 검사 3개 통과
- [x] `node --check apps/web/dist/sw.js`, `git diff --check` 통과
- 500kB 초과 청크 경고는 초기 공통 코드와 별도 단어 데이터에 남아 있다. 실제 브라우저·기기에서의 로딩 시간·PWA 설치·업데이트 확인은 사용자 확인 예정이며, 실제 배포 완료 여부는 별도 확인한다.

### 지침·연계 문서 동기화 (2026-10-16)

- [x] `AGENTS.md` 14~15절과 구조·사양서·그림책 README·lint/PWA 문서 연결
- [x] 사양서의 과거 공유 UI·통합 앱 경로·core 내 Supabase 배치 지침과 실행 명령을 현재 패키지 경계에 맞게 정리
- [x] Aider 읽기 설정에 사양서·진행표 추가 (실제 세션의 자동 로딩 여부는 별도 확인)
- 문서·읽기 설정만 변경했으며 앱 코드·의존성·배포 설정은 변경하지 않았다. 이 작업의 검증은 로컬 참조 경로·명령 대응·공백 검사이며, 위 실행 검사 이력과 구분한다.

## Phase 5. Supabase backend integration and hint RPC (implementation complete; project verification pending)

- [x] Create `user_profiles` schema with RLS, anonymous-user profile creation, and secure hint RPCs.
- [x] Add typed Supabase client and data functions for reading balances, atomically consuming hints, and server-only ad rewards.
- [x] Connect the web app to persistent anonymous Supabase sessions and the server-side hint balance.
- [ ] Configure root `.env.local`, enable anonymous sign-ins, apply the migration, and verify against a real Supabase project.
- [x] Restrict ad reward grants to `service_role` and provide a data helper for a trusted server; ad-platform verification remains in Phases 6 and 7.

## 📌 Phase 6. Toss 미니앱 구현 (`apps/toss` - Apps in Toss)

### 힌트 후속 구현 및 인증서 설정 (2026-10-18)

- 사용자 확인으로 최신 세로 화면의 난이도/크기 한 줄·힌트 목록 표시·스크롤과 설정 학습 초기화가 정상 동작함을 확인했다. 가로 회전 결과와 초기화 후 모든 보존 항목의 실기기 검증은 별도다. 하단 메뉴 명칭은 줄바꿈을 막았고, 상단 제목 여백은 위 56→44px·아래 16→12px로 줄였다. 토스 버튼과의 실제 간격은 새 번들에서 재확인이 필요하다.

- 실기기 퀴즈 레이아웃 회귀 수정: 난이도/크기 버튼이 두 줄로 내려가고 보드가 힌트 목록 공간을 소진하는 화면을 확인했다. 토스 설정 바를 고정 2그룹×3버튼의 한 줄 grid로 바꾸고, 세로 화면의 남은 공간을 보드/힌트에 3:2로 배분하며 힌트 최소 120px를 확보했다. 보드는 크기가 정해진 부모의 가로·세로 container 단위 중 작은 값에 맞춰 축소한다. 가로 화면은 좌우 배치를 유지한다. `apps/toss/src/styles.css`만 실행 코드 수정. 토스 `lint`·`build:ait`(타입 검사 포함), `git diff --check` 통과. CSS 배치 수정이라 동일 로직 테스트는 반복하지 않았으며 실제 iPhone 재확인·회전 검증은 대기다.

- 다음 단계 구현: 토스 하단에 그림책·설정을 추가했다. 그림책은 난이도·목록·읽기·이전/다음·목록 복귀·페이지별 해석·스크린리더 영어 원문·이미지 실패 재시도·AI 활용 고지를 제공하고 SDK 뒤로가기는 읽기→목록→홈으로 처리한다. 공통 원본에서 토스 소유 파일을 생성하는 `scripts/prepare-toss-picture-books.mjs`를 추가했다. 현재 원본 61편 모두 편집/권리 검토 전이므로 포함하지 않았다(승인 작품 0편). 원본의 명시적 `approved` 상태만 허용하며 토스 UI에는 준비 안내를 표시한다. 읽기 UI는 독립 테스트용 2쪽 자료로 검사했다. 실제 작품·삽화 연결은 미완료다.
- 설정의 학습 기록 초기화는 확인 창 후 저장 성공 시에만 반영하고 현재 판을 종료한다. 즐겨찾기·오답노트·힌트 잔액을 보존하며 저장 실패 시 기존 기록을 유지한다. 원격 DB 삭제·지갑 변경은 없다. 현재 기기에서 초기화한 기록이 완료 단어 재출제 기준이다.
- 이 단계 검증: `pnpm.cmd --filter @t-crossword/toss test` 33개, `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(콘텐츠 준비·타입 검사 포함), `git diff --check` 통과. 큰 청크 경고 유지. 실제 기기 메뉴·초기화·읽기·뒤로가기 검증은 미실행. 새 `.ait` 생성, 업로드·배포는 미실행이며 API·터널은 테스트용으로 유지했다.

- PWA·토스 힌트 스크롤 공통 개선: 가로/세로 제목과 진행 숫자를 스크롤 영역 밖의 고정 2열 헤더로 분리했다. 그 아래 가로·세로 문제 목록만 하나의 영역에서 함께 스크롤하며 화면 방향을 바꿔도 두 제목이 항상 보인다. 바깥 힌트 영역은 스크롤하지 않는다. 키보드 포커스는 내부 문제 목록에 제공한다. 웹 `HintListSection.tsx`·`QuizPage.tsx`, 토스 `App.tsx`·`styles.css` 수정.
- 검증: 웹/토스 각각 `lint`·타입 검사를 포함한 `build`/`build:ait` 통과, 토스 테스트 31개 통과. 큰 청크 경고 유지. 실제 브라우저·토스 기기의 가로/세로 스크롤 확인은 미실행이다. 최신 `.ait` 생성 완료, 배포·업로드 미실행.

- PWA와 토스의 홈/퀴즈 흐름 일관성 요청 반영: 토스 홈을 퍼즐 그림·동일한 환영 문구·퀴즈 시작/단어장 관리 버튼으로 변경하고 난이도·크기 설정을 퀴즈 내부로 이동했다. 설정 변경은 선택한 값으로 새 판을 생성하며 성공 후 선택 상태를 반영한다. 홈 왕복은 기존 판을 유지한다. 하단 메뉴에 독립 SVG 아이콘과 명칭을 함께 표시하고 상단 도구 겹침을 줄이도록 여백을 보완했다. TDS·토스 인증·저장·지갑과 독립 UI 경계를 유지한다. 그림책·설정은 후속 구현이다.
- 검증: `pnpm.cmd --filter @t-crossword/toss test` 31개(홈→단어장/퀴즈·설정 변경 전달·홈 왕복 시 판 보존 회귀 포함), `pnpm.cmd --filter @t-crossword/toss lint`, `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사 포함) 통과. 큰 청크 경고 유지. 실제 토스 재업로드 후 홈·상단 여백·회전·작은 화면 검증은 미실행이다.
- 사용자가 오답노트에서 삭제한 `UGLY`가 학습완료 목록에 남아 있음을 확인했고, 새 번들의 동의어 보라색 반영도 확인했다.

- 추가 사용자 화면 확인: 오답노트 `UGLY` 1개에서 삭제 후 0개·빈 목록 안내로 전환됐으며 학습 10개·힌트 14개는 유지됐다. 마지막 홈 화면에도 같은 학습·잔액과 새 퍼즐 시작 버튼이 표시된다. 전체/학습완료 목록에서 `UGLY` 원본 유지 여부, 완전 종료·재접속 수행 여부와 미완성 판의 종료 후 미복원은 이 화면만으로 확정하지 않는다.

- 실제 토스 후속 검증: 사용자가 힌트 사용 단어의 오답노트 등록을 확인했다. 이어 제공한 완료 화면에서 초급 8×8 판의 10/10 완료·학습 10개와 완성 보상 안내, 잔액 9→14(+5)를 확인했다. 힌트 공개·차감·오답노트 등록·판 완성 보상까지 실제 사용자 흐름이 검증됐다. 오답노트 삭제 후 원본/기타 기록 보존, 앱 종료 후 잔액·학습 기록 유지 및 퍼즐 미복원은 확인 대기다.

- 사용자 제공 실제 토스 화면에서 4글자 문제의 힌트 사용 후 첫 글자 `U` 공개, 잔액 10→9, 단어별 사용량 1/1과 한도 도달 시 버튼 비활성화를 확인했다. 오답 표시 남은 횟수 4/4도 표시된다. 오답노트 등록 및 완성 보상 5개는 아직 별도 확인 대기다.
- 단어장 동의어 색상을 힌트와 같은 보라색(`#6d28d9`)으로 변경했다(`App.tsx`, `styles.css`). 토스 `build:ait`(타입 검사 포함)·`lint`·`git diff --check` 통과. 새 번들을 생성했으며 해당 단어장 색상의 실제 기기 반영은 별도 확인이 필요하다.

- 실제 토스 인증 후속 결과: 네트워크 제한 밖에서 API를 재시작한 뒤 사용자가 휴대폰에서 힌트 잔액 표시 성공을 확인했다. 실제 토스 인증·서버 지갑 잔액 조회 경로가 동작함을 확인했다. 힌트 1개 차감·오답노트 등록·판 완성 보상 5개와 재시도/재실행 검증은 아직 별도 확인이 필요하다. 앞선 실패 상태와 재시도 대기 기록은 이 결과로 갱신된다.

- CORS 수정 후 실기기에서 사용자 확인 실패가 표시됐다. 서버의 외부 통신 제한 가능성을 확인하기 위해 사용자 도구 승인 후 API를 네트워크 제한 밖에서 재시작했다. 선택적 인증 진단에 HTTP 상태·제한된 오류 코드/전송 코드만 추가했다. 토큰·인증 코드·인증서·응답 본문은 출력하지 않는다. API `build`와 `test` 13개, `git diff --check` 통과. 실제 인증 재시도 결과 대기 중이며 원인 확정·인증 성공으로 기록하지 않는다.

- 실기기 초기 `Load failed` 원인 확인: 서버에서 실제 테스트 Origin `https://t-crossword.private-apps.tossmini.com`의 CORS 차단을 확인했다. 로컬 API 허용 목록에 이 정확한 Origin을 추가하고 재시작했다. 진단은 환경 변수로 선택하는 거부 Origin 정규화 출력만 추가했으며 요청 본문·토큰·키는 출력하지 않는다. API 타입 검사/빌드는 통과했다. 실제 인증 성공 여부는 재시도 확인 대기다.

- 임시 HTTPS 준비: 사용자 요청으로 공식 Cloudflare `cloudflared` 2026.10.1을 PC 임시 폴더에 내려받아 로컬 API(8787) 터널을 실행했다. 무시되는 토스 `.env.local`에 발급된 HTTPS API 주소를 설정하고 `pnpm.cmd --filter @t-crossword/toss build:ait`를 다시 실행해 성공했다(큰 청크 경고 유지). 외부 HTTPS에서 CORS preflight 204와 미인증 요청 401을 확인했다. 사용자·잔액 변경은 없다. 실제 미니앱 실행 Origin 등록·콘솔 테스트 업로드·토스 인증은 아직 미실행이다. 재시작 시 주소 변경 가능성과 설정 절차는 API README에 기록했다.

- 후속 실제 연결 확인: 사용자가 SQL Editor 실행 성공 화면을 제공했다. 실제 Supabase의 `get_toss_hint_balance`에 존재하지 않는 세션 해시로 요청하여 서버 키는 예상한 `toss_session_expired`(28000), 공개 anon 키는 권한 거부(42501)를 반환함을 확인했다. 사용자 생성·잔액 변경은 없었다. 서버 전용 키 설정도 완료됐으며 키 값은 출력하지 않았다. 아래 DB 미적용·키 미설정 기록은 이 확인 전 상태다. 모든 테이블의 실제 RLS 조회·실제 토스 인증/차감/보상 통합 검증은 아직 미실행이다.

- 별도 `apps/toss-api` Node 24 서버, 토스 인증 코드 mTLS 교환, 공유 DTO·퍼즐 응답 검증·데이터 저장소와 토스 전용 지갑 SQL을 구현했다. 최초 10개, 한 글자당 1개 차감, 단어별 한도, 재시도 중복 차감 방지, 모든 정답 검증 후 판당 5개 지급을 처리한다. 기존 웹 지갑은 유지한다.
- 토스 화면의 잔액·힌트·오류 재시도·공개 글자 보존·오답노트 등록/재표시를 연결했다. 서버 URL이 없으면 힌트와 보상은 비활성이다. 아래 초기 기록의 힌트 미구현 상태는 이 기록으로 갱신된다.
- 사용자 제공 외부 폴더에서 인증서·개인 키 파싱, 키 쌍 일치와 현재 유효기간을 확인했다. 내용을 출력하지 않았다. 무시되는 API `.env.local`에 파일 경로와 기존 공개 Supabase URL을 설정했다. 서버 전용 키는 빈 값이며 프런트 서버 URL은 아직 활성화하지 않았다.
- 검증 통과: `pnpm.cmd typecheck`; `pnpm.cmd --filter @t-crossword/toss test` 30개; `pnpm.cmd --filter @t-crossword/toss-api test` 13개; `pnpm.cmd --filter @t-crossword/core test` 21개; 토스 `lint`·`build:ait`, API `build`, 웹 `build`. SQL은 PGlite에서 권한·소유권·한도·잔액·보상·멱등성을 검사했다. 실제 Supabase 부하 검증은 아니다.
- lockfile 기존 비토스 importer 보존 및 참조 1,376개 확인. `pnpm.cmd install --lockfile-only --frozen-lockfile --offline` 통과. 큰 청크 경고는 유지된다.
- 미실행: 실제 DB 마이그레이션 적용, 서버 전용 키 설정, 실제 mTLS 교환·HTTPS/CORS·토스 기기 통합 검증, 업로드·배포·커밋·푸시. 설정과 경계는 `apps/toss-api/README.md`, `docs/decisions/20261018-toss-hint-api.md` 참조.

- [x] `apps/toss` 스캐폴딩 (SDK 3.8.0 + 독립 Vite, `apps-in-toss.config.ts`)
- [x] React 18 + TDS Mobile/AIT 2.5.1 기반 홈·퍼즐 설정·퀴즈·정답 입력·완료 복습·단어장 1차 UI
- [x] 공유 core 공개 API로 퍼즐 생성·예문 마스킹·어휘 사용, 완료 단어 재출제 제외
- [x] 토스 SDK Storage/브라우저 별도 저장 어댑터, 학습완료·즐겨찾기 복원, 비동기 순차 저장·실패 재시도
- [x] SDK 뒤로가기 구독과 TDS Safe Area 연결 (실제 토스 동작 미검증)
- [x] `t-crossword.ait` 생성 성공; 업로드·배포 미실행
- [x] 글자별 입력·교차 셀 보존·오답 표시 횟수 및 중앙 정렬 정답 창
- [ ] 웹과의 나머지 기능 대응: 오답노트 힌트 등록 연동·그림책·설정
- [ ] Toss SDK 연동 (사용자 인증, 토스 리워드 광고)
- [ ] 서버 힌트 차감·완성 보상 5개와 토스 인증 사용자 연결
- [ ] Toss 샌드박스 환경 동작 검증

### 토스 1차 작업 기록 (2026-10-18)

- 정답 입력 창을 비교 이미지에 맞춰 중앙 정렬·보라색 동의어·글자별 칸으로 변경했다. 이미 완성된 교차 셀은 읽기 전용이며 포커스·방향키·백스페이스는 수정 가능한 셀로 이동한다. 올바른 단어 완성 시 한 번 자동 제출하고 수동 제출도 유지한다. 오답 붉은색 표시는 글자 수만큼 제공하고 정답 글자·삭제·한글 입력은 차감하지 않는다. 소진 후에도 입력·제출을 허용하며 재실행 시 초기화한다. 힌트 버튼은 실제 서버 미연결을 나타내는 `힌트 준비 중`으로 비활성화한다. 보드와 입력 창의 공개 셀 계산은 토스 전용 표시 도우미로 통일했다.
- 힌트 카드 왼쪽 정렬 및 동의어 보라색(`#6d28d9`) 요청도 반영했다. 웹 앱 화면·훅을 import하지 않고 토스 전용 UI를 유지한다.
- 입력 회귀 테스트를 위해 MIT `jsdom` 26.1.0을 토스 개발 의존성으로 추가했다. 최초 DOM 테스트에서 개발 도구가 공유 core 파일에 패널 import를 주입하는 문제를 발견해 플러그인을 개발 서버에만 적용하도록 수정했다. jsdom의 dialog·matchMedia·Safe Area 부재와 초기 포커스 타이머 대기는 테스트 환경에서 보완했다. 실제 토스 SDK 검증으로 간주하지 않는다.
- 검증: `pnpm.cmd --filter @t-crossword/toss test` 3개 파일·21개 통과. 교차 셀 보존·자동 제출 중복 방지·오답 표시 한도·소진 후 제출·정답/삭제/한글 입력 제외·백스페이스·재실행 초기화·빈 칸 안내를 DOM 조작으로 확인했다. `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss lint` 통과. lockfile의 기존 앱 해석을 보존하고 스냅샷 참조 1,371개를 확인했으며 `pnpm.cmd install --lockfile-only --frozen-lockfile --offline`·`git diff --check` 통과. 큰 청크 경고는 유지된다. 실제 브라우저·토스의 가상 키보드·레이아웃·포커스는 미검증이다.

- 웹 대비 퀴즈 안내 누락 보완: 상단에 `한 판을 모두 완성하면 힌트 5개를 드려요.`와 `보상 기능 준비 중`을 함께 표시했다. 실제 서버 지급 기능은 아직 미연결이다. 가로·세로 힌트 카드를 토스 전용 `ClueButton`으로 분리해 동의어가 있으면 별도 줄에 표시하고 빈 동의어는 생략한다. 추가 안내 높이를 반영해 가로 화면의 보드 높이를 조정했다.
- 해당 변경 검증: `pnpm.cmd --filter @t-crossword/toss test` 16개 통과(가로·세로 동의어 표시/빈 값 생략 포함), `pnpm.cmd --filter @t-crossword/toss build:ait`, `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 실제 브라우저·토스 기기에서 긴 동의어 줄바꿈·회전·가독성 확인은 미실행이며 큰 번들 경고는 유지된다.

- 오답노트 누락 보완: 토스 단어장에 네 번째 탭·목록 필터·빈 목록 안내·목록에서만 삭제하는 버튼을 추가했다. 힌트 이력과 숨김 ID를 별도로 저장하고 기존 학습완료·즐겨찾기 기록을 보존한다. 힌트 사용 기능은 아직 토스에 없어 실제 플레이에서의 등록·재표시는 후속 연동 대상이다. 웹 오답노트를 자동 이전하거나 오답 제출을 힌트 사용으로 간주하지 않는다.
- 이 변경의 검증: `pnpm.cmd --filter @t-crossword/toss test` 14개 통과, `pnpm.cmd --filter @t-crossword/toss build:ait`와 `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 기존 기록 호환·숨김 후 저장 복원·다른 기록 보존·잘못된 필드 거부를 검사했다. 실제 브라우저 상호작용·토스 런타임 확인은 미실행이다.
- 이어 하기 범위 확정: 사용자 요청에 따라 앱을 켜 둔 동안만 지원한다. 종료·새로고침 후 진행 중 퍼즐 복원은 후속 구현 대상에서 제외하며 학습완료·즐겨찾기 등 기록 저장은 유지한다.

- 콘솔 등록 후 빌드 구성 확인: 사용자가 앱 이름 `영어 퍼즐`, `appName: t-crossword`, 앱 유형 `게임`으로 생성했다고 확인했다. `apps-in-toss.config.ts`의 `appName`·`webBundleDir: dist`·Vite 출력 및 `.ait` 생성 명령을 확인하고 토스 HTML/화면 제목을 `영어 퍼즐`로 맞췄다. SDK 3.8.0에 없는 예전 이름·게임 유형 필드를 추가하지 않았으며 콘솔 정보는 README에 기록했다. 콘솔 직접 조회·업로드·배포는 미실행이다. 아래 콘솔 미등록 기록은 1차 구현 시작 당시의 상태다.
- 등록 정보 반영 후 `pnpm.cmd --filter @t-crossword/toss build:ait`(타입 검사·웹 빌드·`t-crossword.ait` 생성), `pnpm.cmd --filter @t-crossword/toss lint`, `git diff --check` 통과. 큰 청크 경고는 유지되며 이름 변경에 무관한 기존 테스트를 반복하지 않았다.

- 콘솔 미등록 상태로 사용자와 `appName: t-crossword` 합의. 앱 SDK/TDS는 `apps/toss`에만 설치하고 다른 앱 UI·라우팅은 가져오지 않았다. TDS의 React 18 peer 요구를 따르며 웹의 React 19는 유지한다. 개발 도구 때문에 토스 패키지 Node 조건은 24 이상이다.
- SDK 3.x는 이전 Granite 설정·개발 명령과 달라 실제 설치한 CLI 도움말·설정 타입을 확인했다. Vite 5174 포트·공식 개발 도구 플러그인·`apps-in-toss.config.ts`로 구성했다. 상세 명령·이용 범위·남은 기능은 [토스 README](apps/toss/README.md)에 기록했다.
- 검증: `pnpm.cmd --filter @t-crossword/toss build:ait`로 타입 검사·프로덕션 Vite 빌드·`.ait` 생성 성공. `pnpm.cmd --filter @t-crossword/toss lint` 및 `pnpm.cmd typecheck` 전체 통과. `pnpm.cmd --filter @t-crossword/toss test`는 2개 파일·10개 테스트 통과. 최초 모달 렌더 테스트는 TDS Provider 누락으로 실패했으며 실제 앱과 동일한 Provider를 적용해 통과했다.
- SDK/TDS 의존성 추가로 `pnpm-lock.yaml` 갱신. pnpm 10이 기존 모바일 Ionic/react-router 연결까지 바꾼 것을 diff에서 발견해 기존 워크스페이스 importer·패키지·스냅샷을 보존하고 토스에 필요한 항목만 추가했다. 모든 기존 importer 해석 결과 동일 및 스냅샷 참조 1,255개 연결 확인. `pnpm.cmd install --lockfile-only --frozen-lockfile --offline` 통과. 모듈까지 설치하는 frozen 재검증은 pnpm의 비대화형 모듈 재구성 요구로 중단되어 임의 삭제·재설치를 수행하지 않았다. `protobufjs` 빌드 스크립트는 임의 승인하지 않았다. 토스 번들 약 2.33MB(gzip 약 687kB) 및 큰 청크 경고가 있어 초기 로드 최적화가 남아 있다.
- 추가 확인: `pnpm.cmd --filter @t-crossword/toss dev` 시작 성공, `http://localhost:5174/` 및 `/src/main.tsx` HTTP 200·엔트리 모듈의 개발 도구 주입 확인. 프로덕션 산출물에서 `ait-devtools`, `__AIT_DEVTOOLS`, `AitDevtoolsPanel`, `DEFAULT_STATE` 표식은 발견되지 않았다. 표식 검사만으로 개발 도구 코드 부재를 완전히 증명하지는 않는다. React 18 설치 이후 기존 웹의 `pnpm.cmd --filter @t-crossword/web build`도 통과했고 웹 산출물 해시가 이전과 동일했다. `git diff --check` 통과.
- 미실행: 실제 브라우저 상호작용·토스 샌드박스·토스앱, 네이티브 저장·뒤로가기·Safe Area·키보드·회전·포커스·기기 성능, 로그인·광고·서버 보상 통합과 업로드·배포. 콘솔 등록은 사용자가 완료했다고 확인했다. 기존 웹·모바일 UI 코드는 변경하지 않았다. HTTP 응답·렌더 테스트·개발 모의 실행을 기기 검증으로 간주하지 않는다.

---

## 📌 Phase 7. Mobile 앱 구현 (`apps/mobile` - Ionic + Capacitor)
- [ ] `apps/web`에서 검증된 UI 패턴을 Ionic React 컴포넌트로 구현
- [ ] Capacitor 네이티브 설정 (Android/iOS)
- [ ] AdMob 보상형 동영상 광고 플러그인 연동 (광고 시청 -> 힌트 충전)
- [ ] 모바일 기기/에뮬레이터 동작 검증
