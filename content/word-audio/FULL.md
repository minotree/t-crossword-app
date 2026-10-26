# 전체 단어장 음성 준비

사용자 선택: 단어와 예문 사이 **0.5초 삽입 쉼**, Kokoro v1.0 / af_heart / 24kHz mono / MP3 64kbps. 모델 자체의 앞뒤 무음은 별도로 남을 수 있다. 0.7배속에서는 삽입 쉼이 약 0.714초다.

2026-10-26: 전체 3,839개 생성·기술 검사 완료. 초급 775·중급 1,199·고급 1,365·특급 500개, 음성 163,234,176 bytes, ZIP 117,485,166 bytes(약 117.5MB). 이전 표본 20개를 포함한 정적 파일은 3,866개다. 토스 manifest 3,839개 연결 및 테스트 90개·lint·일반 빌드 통과. 전체 음성의 Cloudflare 업로드와 원격/기기 확인은 사용자 배포 후 진행한다. 번들·APK는 생성하지 않았다.

## 생성·검사

```powershell
artifacts/tts-venv/Scripts/python.exe scripts/generate-all-word-audio.py --workers 4 --threads 1
python scripts/package-all-word-audio.py
```

첫 명령은 네트워크 없이 확인된 로컬 모델을 사용한다. 각 단어를 `artifacts/toss-word-audio-full/checkpoints/`에 기록하므로 중단 후 같은 명령으로 재개할 수 있다. 표제어·예문·설정 해시와 파일 해시가 일치하는 항목만 재사용한다. 오류가 있으면 전체 manifest를 확정하지 않는다. `--limit`는 로컬 성능 점검용이며 제한 실행은 앱 manifest를 갱신하지 않는다.

`full-manifest.json`과 `full-generation-report.json`은 생성 완료 시 기록한다. `package-all-word-audio.py`는 3,839개 전체의 본문 대응·해시·MP3 디코딩·24kHz mono·길이·비무음·삽입 구간 중앙 0.3초의 peak<0.001·발음 기호 누락 기록을 다시 검사한다. 단어마다 실제 발음이 맞는지 사람이 전수 청취한 검사는 아니다. 자동 검사가 통과한 다음에만 토스의 `src/data/word-audio.json`을 갱신한다.

현재 CSV와 JSON의 개별 단어·예문 대응을 유지한다. CSV는 수정하지 않는다. 생성에 실패한 발음·문장이 있으면 누락 없이 식별해 재검토하고, 검사를 통과시키려고 원문 단어장 내용을 임의로 바꾸지 않는다.

## 업로드 산출물

후속 확인: 콘솔 ZIP 25MiB 및 파일 1,000개 제한으로 사용자가 Wrangler 배포를 완료했다. 전체 공개 manifest 3,839개 일치와 난이도별 MP3 4개 원본 해시·HTTP/MIME/CORS/캐시를 확인했다(`full-remote-validation.json`). 전체 원격 MP3 전수 다운로드와 토스 실제 기기 재생 검증은 별도다. 이후 재배포도 콘솔 대신 다음 명령을 사용한다.

```powershell
npx.cmd wrangler login
npx.cmd wrangler deploy --config artifacts/toss-word-audio-full/wrangler.jsonc
```

- `artifacts/toss-word-audio-full/public/`: MP3·공개 manifest·검색/청취 페이지·고지·캐시/CORS 헤더.
- `artifacts/toss-word-audio-full.zip`: public 내용만 담은 Cloudflare 업로드 ZIP.
- `artifacts/toss-word-audio-full/wrangler.jsonc`: 기존 `crossword-word-audio` 프로젝트에 정적 자산만 배포할 수 있는 설정. 이번 작업에서 배포 명령을 자동 실행하지 않는다.
- `artifacts/toss-word-audio-full/word-audio-links.csv`: 다른 앱용 영단어·예문·공개 URL 대응표(UTF-8 BOM).
- `content/word-audio/full-validation.json`: 파일 개수·용량·보존 표본 수·최종 검사 결과.

전체 MP3와 ZIP·체크포인트는 로컬 배포 산출물이며 Git에서 제외한다. 입력 데이터·생성 코드·모델/환경 기록·전체 제작 manifest·검사 보고서·토스용 작은 manifest를 저장소에 보존해 일반 앱 빌드에 Python이 필요하지 않게 한다.

새 배포에는 이미 토스에 배포한 v1·v2 표본 MP3 20개도 포함한다. 주소가 바뀌는 파일을 먼저 Cloudflare에 올린 뒤 새로운 토스 번들을 사용한다. 업로드 시 이전 파일을 제거하는 별도 정리 작업은 하지 않는다. 새 전체 음성이 올라가기 전에는 새 토스 manifest의 URL이 아직 존재하지 않을 수 있다.

무료 정적 자산 파일 개수·개별 크기 검사는 패키지 준비 시 수행한다. Cloudflare 콘솔 업로드가 전체 ZIP의 파일 수/크기를 거절하면, 사용자가 Wrangler의 기존 프로젝트 배포 경로로 진행해야 할 수 있다. Pages나 익명 Drop의 업로드 한도를 Workers Static Assets 전체 한도와 같다고 가정하지 않는다. 결제·R2·유료 Worker 코드는 추가하지 않는다.

## 다른 앱에서 사용

공개 목록 주소: `https://crossword-word-audio.minotree0902.workers.dev/manifest.json` (전체 패키지 업로드 후 사용 가능).

스키마는 `schemaVersion: 1`, `pauseMs: 500`, `audioPath: "word-audio/"`, `entries`의 영단어 대문자 키다. 각 항목에는 원 단어 ID·영단어·예문·파일명·파일 SHA-256·초 단위 길이가 있다. `sourceCsvSha256`로 동일 CSV인지도 확인할 수 있다.

화면 준비 중에 작은 manifest만 가져온 뒤 `entries[영단어.toUpperCase()]`를 찾고 **예문이 현재 CSV와 정확히 같은지** 확인한다. 단어만 같고 예문이 다르면 그 결합 음성을 사용하지 않는다. 파일 URL은 기본 주소와 `audioPath`, 해당 항목의 `file`을 연결한다. 앱마다 단어 ID가 같을 필요는 없다.

MP3는 사용자의 듣기 클릭에서 재생하며 일괄 미리 다운로드하지 않는다. 주소는 공개 파일 경로이고 사용자 정보·API 키·토큰을 붙이지 않는다. 최초 재생의 네트워크 연결·기기 음량·무음 모드·앱 전환·전화/음악/광고 오디오 포커스는 실제 대상 환경에서 확인한다.

모델·라이선스 확인 범위는 [제작 README](README.md)를 따른다. 사용자가 승인한 표본 일반 음질과 모든 단어의 전문적인 발음 감사를 구분한다. 기본·특급 의미가 다의어의 특정 발음을 요구하는 경우는 사람이 별도로 청취 검토해야 한다.
