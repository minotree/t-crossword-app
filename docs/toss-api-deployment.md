# 토스 API Docker 배포 준비

> 2026-10-19 방향 변경: 사용자의 무료·서버 관리 없는 출시 기준에 따라 이 운영 방향은 중단했다. 파일은 참고용이며 설치·배포할 필요가 없다. 최신 검토는 [무료 출시 검토](toss-free-hosting.md)를 따른다.

현재 상태: 배포 파일 준비·로컬 API 검사 완료. Docker 이미지 빌드·컨테이너 실행·호스팅 배포는 미검증이다. 호스팅 업체는 아직 선택하지 않았다.

## 이미지 만들기

Docker Engine/BuildKit이 있는 환경에서 저장소 루트를 빌드 컨텍스트로 사용한다.

```powershell
docker build --file apps/toss-api/Dockerfile --tag t-crossword-toss-api:local .
```

Node 24 Debian slim과 pnpm 10.34.7을 사용한다. API와 공통 contracts/core/data만 설치·빌드하며 웹·토스 UI와 콘텐츠 삽화는 포함하지 않는다. frozen lockfile을 사용하고 최종 이미지에는 Vite가 번들한 서버와 package.json만 복사한다. 실행 단계에는 pnpm·node_modules가 필요하지 않도록 구성했다. 실제 Linux 컨테이너에서 누락된 런타임 의존성이 없는지 확인해야 한다.

Dockerfile 전용 `Dockerfile.dockerignore`는 허용한 소스·설정만 빌드 컨텍스트에 포함한다. `.env`·인증서·개인 키·기존 산출물은 제외한다. 비밀 값을 Dockerfile의 ARG/ENV나 이미지 레이어에 넣지 않는다. Node 24 태그는 패치 업데이트에 따라 바뀌므로 운영 이미지 검증 후 이미지 digest를 배포 기록에 보관한다.

## 실행 설정

호스팅의 secret 설정으로 아래 값을 전달한다. 로컬 검사 시에는 저장소 밖의 환경 파일을 사용할 수 있다.

| 값 | 설정 |
| --- | --- |
| SUPABASE_URL | 기존 프로젝트 HTTPS URL |
| SUPABASE_SERVICE_ROLE_KEY | 서버 전용 키 |
| TOSS_ALLOWED_ORIGINS | 실제 토스 실행 Origin의 정확한 목록, 쉼표 구분 |
| TOSS_MTLS_CERT_PATH | `/run/toss/t-crossword-cert.pem` |
| TOSS_MTLS_KEY_PATH | `/run/toss/t-crossword-key.pem` |
| TOSS_MTLS_KEY_PASSPHRASE | 암호화된 키인 경우만 지정 |
| HOST / PORT | 이미지 기본 `0.0.0.0` / `8787`, 호스팅 포트 설정에 맞춤 |

인증서·키는 호스트의 비공개 폴더 또는 호스팅 secret 파일에서 읽기 전용으로 마운트한다. 컨테이너는 기본 node 사용자(UID 1000)로 실행하므로 해당 사용자의 읽기 권한이 필요하다. 키를 모든 사용자에게 공개하는 권한 변경으로 해결하지 않는다. Windows용 기존 `.env.local`의 인증서 경로는 Linux 컨테이너에서 사용할 수 없다.

다음 예시는 환경 파일과 인증서가 이미 준비된 로컬 검사용이다. 경로를 실제 비공개 폴더로 바꾼다. API 포트는 호스트 루프백에만 연결한다.

```powershell
docker run --detach --name t-crossword-toss-api --restart unless-stopped --read-only --cap-drop ALL --security-opt no-new-privileges --stop-timeout 20 --publish 127.0.0.1:8788:8787 --env-file C:/private/toss/api.production.env --mount type=bind,source=C:/private/toss/certs,target=/run/toss,readonly t-crossword-toss-api:local
Invoke-RestMethod http://127.0.0.1:8788/healthz
docker inspect --format '{{json .State.Health}}' t-crossword-toss-api
```

`GET /healthz`는 인증·DB·토스 API 호출 없이 프로세스 응답만 확인한다. 인증서의 파싱·유효기간이나 DB 연결 성공을 보장하지 않는다. 상태 확인으로 사용자·지갑을 생성하지 않는다. SIGTERM/SIGINT 수신 시 새 연결을 받지 않고 진행 중 요청을 기다리며, 15초가 지나면 연결을 닫고 실패 종료한다. 호스팅 종료 유예는 20초 이상으로 설정한다. 종료 직전 응답 유실은 같은 요청 ID 재시도로 복구해야 한다.

## 호스팅 전환 순서

1. Node 24 Linux 컨테이너·외부 HTTPS/mTLS 통신·비밀 파일 마운트·자동 재시작을 지원하는 서버를 선택한다. 상시 실행 여부·비용·리전을 확인한다.
2. 로컬 또는 CI에서 이미지를 빌드하고 위 상태 확인과 실제 설정으로 기동을 확인한다. 빌드 로그·이미지에 비밀 정보가 없는지도 확인한다.
3. HTTPS 프록시와 정확한 Origin, `/session` 인증 시도 및 전체 요청 제한을 설정한다. 전달된 IP 헤더를 무조건 신뢰하지 않는다. 현재 앱에는 프록시 요청 제한이 없으므로 외부 서비스 전 반드시 호스팅 측에서 구성한다.
4. 운영 배포 승인 후 이미지를 배치한다. 서버 키·인증서 원문을 기록하지 않고 상태 코드·지연·오류율·재시작을 관찰한다. 인증서 만료 알림과 세션/판 보관 정책을 정한다. 데이터 정리는 별도 승인 후 진행한다.
5. 운영 주소에서 상태 확인·허용/거부 Origin·실제 토스 인증을 검증한다. 토스의 `VITE_TOSS_HINT_API_URL`을 운영 HTTPS 주소로 변경하고 `build:ait`를 실행한다. 토스 업로드는 별도 승인 범위다.
6. 실제 토스에서 잔액 유지·힌트 차감·통신 실패 재시도·완성 보상과 중복 지급 방지를 확인한다. 문제가 있으면 이전 이미지와 앱의 API 설정으로 복구한다. DB 스키마를 자동 롤백하지 않는다.

Docker 설치·호스팅 계정 생성·과금·서버 배포·토스 업로드는 이번 준비 작업에서 실행하지 않았다. 기존 임시 터널과 로컬 설정은 유지한다.

공식 근거(2026-10-19 확인): [Docker 다단계 빌드](https://docs.docker.com/build/building/multi-stage/), [Docker 빌드 컨텍스트와 전용 ignore 파일](https://docs.docker.com/build/concepts/context/#dockerignore-files), [Node HTTP 서버 종료](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback).
