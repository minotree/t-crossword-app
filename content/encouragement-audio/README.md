# 퀴즈 응원 문구 영어 음성

2026-10-30 후속: 사용자가 Cloudflare 정적 프로젝트 `crossword-content-audio`에 업로드했다. 현재 토스 재생 주소는 `https://crossword-content-audio.minotree0902.workers.dev/encouragement-audio/`이다. 50개 파일의 HTTP·바이트 해시·MIME·CORS·캐시 검사를 통과했다. 기록은 `../picture-book-audio/content-audio-remote-validation.json`을 따른다. 초기 앱 내 MP3도 보존했지만 실제 플레이어는 원격 음성을 사용한다. 아래 미배포/앱 내부 재생 설명은 최초 제작 이력이다.

50개 생성·기술 검사 완료: 총 **1,144,128바이트(약 1.14MB)**. 토스 앱에 반영했으며 배포는 하지 않았다.

2026-10-30 사용자 요청: 토스 퀴즈 하단의 사용자 제공 응원 문구 50개를 기존 일반인 성우 `af_heart`로 읽는다. 영어만 입력하고 한글 해석은 읽지 않는다. 원문은 `apps/toss/src/data/encouragements.json`이며 외부 작가의 격언 인용으로 표시하지 않는다.

## 제작과 권리 기록

- 기존 오프라인 Kokoro Python 0.9.4 / `hexgrad/Kokoro-82M` v1.0 / af_heart를 재사용한다. 새로운 외부 음성이나 실존 인물의 참조 녹음은 추가하지 않는다. 속도 1, 24kHz mono, MP3 64kbps, 별도 무음 삽입 없음.
- 모델 revision·모델/음성 파일 해시·입력 원문 해시·스크립트 해시·실제 생성 날짜·설정은 `generation-report.json`, 각 문장/파일/음소/길이는 `manifest.json`에 기록한다. 모델 파일은 합성 전에 기존 provenance와 대조한다.
- 라이선스 및 공식 모델/음성 출처 검토는 `../word-audio/README.md`, `../word-audio/model-provenance.json`, `../word-audio/KOKORO-APACHE-2.0.txt`를 따른다. 모델·코드의 Apache-2.0을 생성 음성의 비침해 또는 독점권 보장으로 해석하지 않는다. 이번 작업은 새로운 외부 약관 검토나 법률 검토가 아니다.
- 50개 전수 청취·발음/억양 검수와 실제 토스 기기 검증은 대기다. 디코딩·비무음·음소 누락 검사만으로 발음 정확성을 보장하지 않는다.

## 재생과 파일

`apps/toss/public/encouragement-audio/`의 해시 파일명 MP3와 `src/data/encouragement-audio.json`을 토스 앱에 함께 포함한다. 모델·Python·중간 체크포인트는 앱에 포함하지 않는다. 앱 파일 확보 전의 오프라인 사용을 보장하지 않는다. 기존 단어장 Cloudflare 파일이나 그림책의 진행 중 생성 작업을 변경하지 않는다.

해석 버튼 옆 `영어 듣기`를 누를 때만 재생한다. 같은 버튼으로 중지하며 새 퍼즐·메뉴 이동·백그라운드 전환 시 멈춘다. 초기 로딩과 버퍼링은 15초 후 오류로 전환해 재시도를 허용한다. 단어장 음성은 메뉴 전환 시 기존 동작으로 중지된다. 설정 화면에 AI 생성 음성임을 표시한다.

```powershell
artifacts/tts-venv/Scripts/python.exe scripts/prepare-encouragement-audio.py
artifacts/tts-venv/Scripts/python.exe scripts/check-encouragement-audio.py
```

원문/설정/파일 해시가 맞는 생성 체크포인트는 재사용한다. 바뀐 음성은 새 해시 파일명으로 보관한다. 청취 미리보기는 `artifacts/encouragement-audio/public/index.html`이다. 업로드·배포용 패키지 생성은 이번 범위가 아니다.
