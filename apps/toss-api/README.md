# 영어 퍼즐 · 토스 힌트 API

`t-crossword`의 토스 사용자 확인과 힌트 지갑을 연결하는 Node.js 24 서버다. 퍼즐 엔진은 `@t-crossword/core`, Supabase RPC 접근은 `@t-crossword/data`, DTO 검증은 `@t-crossword/contracts` 공개 API를 사용한다. 웹의 익명 Supabase 세션·잔액과는 별도의 사용자·지갑이다.

## 로컬 연결

1. Supabase 프로젝트에 `supabase/migrations/20261018_toss_hint_wallet.sql`을 적용한다. 이번 프로젝트는 사용자 승인 후 사용자가 SQL Editor에서 적용했고 RPC 연결·공개 키 권한 거부 및 실제 토스 힌트/보상을 확인했다. 다른 환경에 적용할 때도 운영 DB 변경 승인이 필요하다. 기존 웹 지갑은 변경하지 않는다.
2. 이 디렉터리의 `.env.example`을 `.env.local`로 복사하고 직접 값을 설정한다. `SUPABASE_URL`, 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`, `t-crossword`용 `TOSS_MTLS_CERT_PATH`·`TOSS_MTLS_KEY_PATH`, 정확한 `TOSS_ALLOWED_ORIGINS`가 필요하다. 암호화된 개인 키에는 `TOSS_MTLS_KEY_PASSPHRASE`도 설정한다. 실제 키·인증서 내용은 채팅·코드·브라우저 환경변수에 넣지 않는다. 인증서 파일은 저장소 밖에 보관한다.
3. 저장소 루트에서 실행한다.

```powershell
pnpm --filter @t-crossword/toss-api build
pnpm --filter @t-crossword/toss-api start
```

4. `apps/toss/.env.example`을 `apps/toss/.env.local`로 복사하고 `VITE_TOSS_HINT_API_URL=http://localhost:8787`을 설정한 뒤 토스 개발 서버를 재시작한다. 이 주소에는 API 루트만 지정한다.

```powershell
pnpm --filter @t-crossword/toss dev
```

브라우저 AIT 개발 도구의 모의 인증 코드는 실제 토스 서버가 발급한 코드가 아니므로 실제 mTLS 교환에 사용할 수 없다. 실제 인증·잔액 확인은 토스 환경에서 수행해야 한다. 인증 실패 시 로컬 사용자나 임의의 힌트 10개로 우회하지 않는다. API URL이 없으면 현재처럼 로컬 퍼즐은 풀 수 있으나 힌트·보상은 비활성 상태다. URL을 지정한 경우에는 서버에서 발급한 퍼즐만 힌트·보상에 사용한다.

## 운영 구성

### 임시 HTTPS 기기 테스트

로컬 서버 프로세스도 토스 파트너 API와 Supabase에 외부 HTTPS 통신할 수 있어야 한다. 실행 도구의 네트워크 제한이 적용되면 터널 연결만 성공하고 인증은 실패할 수 있다. 개발 진단이 필요하면 서버 프로세스에 `TOSS_LOG_AUTH_STATUS=true`를 지정해 HTTP 상태·제한된 오류 코드만, `TOSS_LOG_REJECTED_ORIGINS=true`로 거부된 정규화 Origin만 확인한다. 요청 본문·인증 코드·키·토큰을 로그에 추가하지 않는다. 진단은 기본 비활성이다.

Cloudflare 공식 `cloudflared`의 Quick Tunnel로 로컬 API를 임시 공개할 수 있다. 이 저장소에 실행 파일이나 인증서를 포함하지 않는다.

```powershell
cloudflared tunnel --url http://127.0.0.1:8787 --no-autoupdate
```

출력된 HTTPS 주소를 토스 앱의 무시되는 `.env.local`에 `VITE_TOSS_HINT_API_URL`로 지정하고 `build:ait`를 다시 실행한다. 실제 미니앱 실행 주소의 Origin을 확인한 뒤 API의 `TOSS_ALLOWED_ORIGINS`에 정확히 추가하고 서버를 재시작한다. API 터널 주소와 미니앱 Origin은 서로 다른 값이다. 터널 재시작으로 API 주소가 바뀌면 앱을 다시 빌드해야 한다. PC·API·터널이 실행 중일 때만 사용할 수 있으며 운영 호스팅으로 사용하지 않는다. 토스 SDK 3.x는 기존 2.x 샌드박스를 지원하지 않으므로 콘솔의 테스트 실행 경로를 사용한다. 브라우저 개발 도구의 모의 인증은 실제 mTLS 인증 검증을 대신하지 않는다.

- 서버를 인증서 파일과 환경변수를 안전하게 설정할 수 있는 Node.js 호스팅에 배치한다. SDK mTLS를 일반 웹 페이지·정적 Vercel 사이트에서 호출하지 않는다. 이 서버는 기본적으로 `127.0.0.1:8787`에 바인딩하며 프록시/컨테이너 환경에 맞춰 `HOST`와 `PORT`를 설정한다.
- HTTPS 종료·허용 Origin·인증/요청 rate limit은 호스팅 프록시에서 설정한다. 클라이언트는 운영 빌드에서 HTTPS API URL만 허용한다. 실제 토스 페이지의 Origin을 확인해 `TOSS_ALLOWED_ORIGINS`에 등록한다. 임의의 토스 도메인을 추측하거나 `*`를 쓰지 않는다.
- `.ait` 빌드는 토스 API 서버를 배포하지 않는다. API 배포·환경변수·DB 적용과 별도로 토스 앱을 빌드한다. `VITE_TOSS_HINT_API_URL`은 빌드 시 포함되므로 운영 API 주소 변경 후 재빌드해야 한다.
- 사용자 인증 코드는 즉시 한 번 교환한다. 서버가 토스에서 받은 `anonKey`만 신뢰하고 `t-crossword`와 함께 SHA-256으로 해시해 사용자 키로 저장한다. 클라이언트가 보낸 사용자 해시는 사용하지 않는다.
- 자체 32바이트 임의 세션 토큰은 메모리로만 클라이언트에 전달하며 DB에는 해시만 저장한다. 만료는 1시간이고 만료 응답 시 클라이언트는 새 SDK 인증 코드로 한 번 재인증한다. DB의 만료 세션·오래된 판/요청 정리 정책은 운영 단계에서 정한다. 자동 데이터 삭제는 구현하지 않았다.
- 사용자·판·힌트 요청 테이블은 RLS를 켜고 `anon`, `authenticated`, `PUBLIC`의 직접 접근과 RPC 실행을 차단한다. mTLS로 사용자 확인을 마친 이 서버만 service role로 호출한다. 키는 토스 번들에 포함하지 않는다.

## 동작

| 경로 | 처리 |
| --- | --- |
| `POST /session` | SDK 일회용 `code`를 mTLS로 교환하고 자체 세션과 잔액 반환 |
| `POST /balance` | 유효한 자체 Bearer 세션의 현재 잔액 반환 |
| `POST /round` | 인증 확인 후 공유 엔진으로 출제·저장, `roundId`·퍼즐·잔액 반환 |
| `POST /hint` | 소유 판·대상·사용 한도 확인, 한 글자 공개·잔액 1 차감 |
| `POST /answer` | 저장된 출제 정답 검증·완료 표시, 전 단어 완성 시 5개 한 번 지급 |

- 최초 사용자만 힌트 10개로 생성한다. 인증 재시도·재시작에는 기존 잔액을 사용한다.
- 단어별 한도는 공유 엔진이 설정한 3~4자 1개, 5~6자 2개, 7자 이상 3개다. 금액이나 정답은 클라이언트가 지정하지 않는다.
- wallet 행 잠금과 트랜잭션으로 차감·완성 보상을 처리한다. 힌트는 `(판, 요청 UUID)` 재시도와 같은 공개 위치의 재요청에 중복 차감하지 않는다. 같은 UUID로 다른 위치를 요청하면 거부한다. UI는 같은 위치의 실패 재시도에 UUID를 유지한다.
- 판 생성은 사용자당 시간당 60개 이하로 제한한다. 판은 생성 후 24시간까지 사용할 수 있다. 저장된 판은 보상·차감 검증용이며, 사용자 요청에 따라 앱 종료 후 판 복원 UI는 제공하지 않는다.
- 전체 정답을 알고 있는 앱이므로 자동 풀이·봇 자체를 막는 시스템은 아니다. 임의 판 UUID나 단순 완료 주장으로 보상을 지급하지 않고, 서버에서 출제한 모든 단어에 맞는 답을 제출했을 때만 지급한다.

## 검증 범위

`pnpm --filter @t-crossword/toss-api test`는 PGlite(PostgreSQL)에서 실제 마이그레이션을 실행하고 최초 지급·중복 차감·단어 한도·잔액 0·다른 사용자 접근·세션 만료·정답 검증·완성 보상 재요청·클라이언트 역할 권한을 검사한다. HTTP 핸들러는 인증 실패·사용자 위조·CORS·입력 검사·토큰 해시 전달을 검사한다. PGlite는 Apache-2.0 라이선스의 개발 의존성이며 운영 서버/앱 번들에는 포함하지 않는다.

사용자가 SQL Editor 적용과 실제 토스 인증·잔액 조회·힌트 10→9 차감·완성 보상 9→14를 확인했다. 임시 HTTPS 터널을 통한 연결이며 상시 호스팅·프록시 요청 제한, 실제 Supabase 다중 연결·동시성 부하, 통신 실패 후 동일 요청 재시도는 추가 검증이 필요하다. PGlite는 단일 프로세스 검사이며 다중 연결 부하 테스트를 대체하지 않는다.

공식 문서 확인(2026-10-18): [사용자 식별키 인증 코드](https://developers-apps-in-toss.toss.im/guide/authentication/anonymous-key-auth-code.md), [교환 API 명세](https://developers-apps-in-toss.toss.im/api/user-key.md). 공개 문서는 네트워크 도구로 직접 읽어 `POST https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/users/anon-key/exchange`, mTLS, `resultType: SUCCESS`와 `success.anonKey` 형식을 확인했다.
