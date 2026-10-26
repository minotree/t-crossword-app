# 토스 단어장 음성 제작

## 현재 전체 버전: v3 · 3,839개 · 0.5초 삽입 쉼

전체 생성과 기술 검사가 완료됐다. MP3 3,839개 163,234,176 bytes, 이전 v1/v2 표본 20개를 포함한 업로드 ZIP은 117,485,166 bytes다. `artifacts/toss-word-audio-full.zip`을 기존 Cloudflare 프로젝트에 먼저 업로드한 후 토스 번들을 생성한다. 토스 소스는 전체 목록을 참조하며, 전체 Cloudflare 업로드·원격 재검사·실제 토스 기기 검증은 아직 수행하지 않았다. 토스 테스트 90개·lint·타입 검사를 포함한 일반 빌드는 통과했다. `.ait`·APK는 생성하지 않았다.

전체 CSV/JSON 대응·파일 해시·디코딩·비무음·무음 구간·발음 기호 누락 검사를 통과했다. 발음 기호의 존재는 발음 정확도 검증이 아니다. 사용자는 v2 표본 일반 음질을 청취 확인했으며, v3 전체를 사람이 전수 청취하지는 않았다. 모델 자체의 앞뒤 무음은 0.5초 삽입 쉼에 더해 남을 수 있다. 생성·재개·업로드·다른 앱에서의 재사용은 [전체 안내](FULL.md)를 따른다. 전체 기록은 `full-manifest.json`, `full-generation-report.json`, `full-validation.json`에 보존한다.

아래는 표본 제작 당시의 이력이다. 이후 사용자가 v2를 업로드하고 잘 들린다고 확인했으며, 원격 파일 해시·HTTP·MIME·CORS 검사는 `remote-validation.json`에 남아 있다.

## 표본 v2 기록 · 단어 뒤 0.8초 쉼 추가

사용자 간격 피드백에 따라 단어와 예문을 각각 합성한 뒤 PCM 19,200샘플(24kHz 기준 0.8초)의 무음을 사이에 삽입했다. 모델이 원래 생성한 앞뒤 무음은 별도로 남을 수 있다. 일반 속도의 삽입 구간은 0.8초이고 0.7배속에서는 약 1.14초다. 현재 10개는 다시 청취 확인 대기다. v1 제작·사용자 피드백·원격 검사·생성 코드 기록은 `revisions/v1/`에 보존했다.

**현재 미리보기는 `artifacts/toss-word-audio-preview-v2/public/index.html`, 업로드 ZIP은 `artifacts/toss-word-audio-preview-v2.zip`이다.** 이전 경로와 아래 v1 숫자는 제작 이력이다. 새로운 MP3 10개는 476,160 bytes이며 전체 단순 추정은 182,797,824 bytes다. ZIP에는 기존 토스 버전의 URL도 유지하도록 검증된 v1 MP3 10개를 추가 보존했다(총 20개 MP3, ZIP 625,438 bytes). 토스 manifest는 v2 10개만 가리킨다.

`python scripts/check-word-audio.py`는 v2 전체 디코딩·해시·본문 대응과 삽입 무음 가운데 0.6초의 peak<0.001을 검사하고 v1 파일도 해시 대조 후 패키지에 포함한다. Cloudflare를 먼저 ZIP으로 갱신한 뒤 새 토스 번들을 사용해야 새 URL이 재생된다. 현재 실제 Cloudflare는 v1이며 v2 업로드는 사용자 대기다. 로컬 HTTP 미리보기는 아래 명령을 사용한다.

```powershell
python -m http.server 4186 --bind 127.0.0.1 --directory artifacts/toss-word-audio-preview-v2/public
```

## v1 기록

2026-10-26: **표본 10개 생성·기술검사 완료, 청취/기기 검수 대기**. 전체 3,839개 생성과 공개 배포는 아직 하지 않았다.

후속 상태: 사용자가 로컬 표본 청취 후 긍정 피드백을 주었고 Cloudflare 표본 업로드를 직접 완료했다. `sample-listening-review.json`은 이 일반 피드백의 범위를 기록하며 단어별 발음 감사 완료를 뜻하지 않는다. 실제 주소는 https://crossword-word-audio.minotree0902.workers.dev/ 이다. MP3 10개 HTTP 200·해시·MIME·CORS·캐시 및 토스 프로덕션 주소 연결 검사가 완료됐다. Range에는 전체 파일 200이 반환돼 부분 재생 지원은 확인하지 않았다. 토스 번들·기기 청취 및 전체 생성은 여전히 대기다. 아래 ‘주소 미설정/공개 미배포’는 초기 준비 당시의 상태다.

## 제작 기록

- 도구: Kokoro Python 0.9.4, 모델 `hexgrad/Kokoro-82M` v1.0, 미국 영어 `af_heart`. 리비전·파일 해시는 `model-provenance.json`, 실제 환경은 `generation-environment.json`에 기록했다. PC CPU에서 추론하며 앱에 모델·Python 도구를 배포하지 않는다.
- 문장 입력: 현 단어장의 영어 표제어를 소문자로 바꾼 뒤 마침표·공백·영어 예문을 연결한다. 대문자 UI 표기를 그대로 넣어 단어가 철자 나열로 읽히는 일을 줄인다. 실제 입력은 `sample-manifest.json`의 word/example 및 textSha256으로 재현한다.
- 표본: YOU, SEA, SAME, APPLE, SCIENCE, KNOWLEDGE, ENVIRONMENT, ABSTRACTION, CORRELATION, EPISTEMOLOGY. 기초 단어·묵음/다음절·특급 학술어와 길이가 다른 예문을 포함한다. 첫 시도에서 현재 단어장에 없는 BEAUTIFUL을 발견해 존재하는 SCIENCE로 교체했다. 단어 데이터는 수정하지 않았다.
- 설정: 모델 eval 모드, 속도 1, 24kHz mono, MP3 64kbps. 재생 시 일반 1.0·느림 0.7에 pitch 보존을 요청한다. 브라우저별 실제 음질은 기기에서 확인한다.
- 파일명은 단어 ID와 **실제 MP3 바이트 SHA-256 앞 16자리**로 만든다. 음성이 다시 생성되면 URL도 바뀌므로 장기 캐시가 이전 음성을 재생하지 않도록 한다. 본문/단어 일치도 토스 플레이어가 비교한다.

## 권리 확인 범위

- [공식 모델 카드](https://huggingface.co/hexgrad/Kokoro-82M)는 Apache-2.0 및 제작/운영 용도를 명시한다. [공식 음성 목록](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)에 `af_heart`가 포함되며 저장소의 선택 음성에 별도 제한 표시는 확인되지 않았다. 모델 카드·음성 목록 원본을 `kokoro-README.md`, `kokoro-VOICES.md`로 보존했다. 모델·음성의 원본 해시를 확인했으며 타인의 음성을 별도로 복제하지 않았다.
- [추론 코드 LICENSE](https://github.com/hexgrad/kokoro/blob/main/LICENSE)의 Apache-2.0 전문을 `KOKORO-APACHE-2.0.txt`로 보존하고 업로드 폴더에도 포함했다. 코드/가중치 라이선스가 모든 생성 음성의 비침해·독점권을 보장한다고 해석하지 않는다.
- 모델 제작자가 기재한 학습 데이터 설명과 Koniwa(CC BY 3.0), SIWIS(CC BY 4.0) 표시는 원본 모델 카드에 보존했다. 개별 학습 음원·각 생성 음성과의 법적 관계를 독립적으로 전수검증한 것은 아니다. 표본의 발음·내용은 사람의 청취 검수 후 채택한다.
- 생성에 사용한 단어·예문은 현재 앱 단어장 원문이며 특급의 제작 경위는 `content/special-vocabulary/README.md`를 따른다. 별도 사전 발음 녹음·상업 음원은 추출하지 않았다.

## 결과·검증

- MP3 10개 합계 **344,640 bytes**, 평균 34,464 bytes. 표본 평균으로 전체를 추정하면 약 132.3MB이며, 실제 전체 용량은 예문 길이 분포에 따라 달라진다. 업로드 ZIP은 약 299KB다.
- `sample-report.json`: 도구/모델·설정·날짜·생성 시간·스크립트 해시.
- `validation.json`: MP3 디코딩·샘플레이트·길이·유한값/비무음·바이트 해시·단어장/런타임 manifest 대응 검사. 발음의 정확성·자연스러움·의미별 발음 판정은 포함하지 않는다.
- 현재 유효한 업로드 폴더: `artifacts/toss-word-audio-preview/public/`. 현재 ZIP: `artifacts/toss-word-audio-preview.zip`. 이전 `toss-word-audio-sample` 폴더는 초기 제작 이력이며 업로드 대상으로 안내하지 않는다.

```powershell
# 최초 준비에만 네트워크가 필요하다. 저장소의 일반 앱 의존성에는 추가하지 않는다.
python -m venv --system-site-packages artifacts/tts-venv
artifacts/tts-venv/Scripts/python.exe -m pip install kokoro==0.9.4 lameenc==1.9.0 espeakng-loader==0.2.4
artifacts/tts-venv/Scripts/python.exe scripts/prepare-word-audio.py --download
artifacts/tts-venv/Scripts/python.exe -m pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
# 로컬 생성·검사·ZIP 준비. 배포 명령은 실행하지 않는다.
artifacts/tts-venv/Scripts/python.exe scripts/prepare-word-audio.py
python scripts/check-word-audio.py
```

전체 라이브러리 및 torch 호환성은 기록된 환경을 참고한다. 임의의 새 Python 환경에서 위 명령만으로 같은 실행 결과를 보장하지 않는다.

## 확인 순서

1. `public/index.html`을 브라우저로 열고 10개 단어/예문과 느린 재생을 직접 듣는다. 파일 경로로 재생이 차단되면 프로젝트 루트에서 `python -m http.server 4186 --bind 127.0.0.1 --directory artifacts/toss-word-audio-preview/public`을 실행해 `http://127.0.0.1:4186`으로 확인한다.
2. 표본을 채택한 뒤 사용자가 Cloudflare Workers Static Assets에 public 폴더의 내용을 업로드한다. PWA/Vercel·R2에는 음성을 추가하지 않는다. `wrangler.jsonc`는 CLI 배포용 준비 파일일 뿐이며 public ZIP에는 포함하지 않는다. CLI 또는 콘솔 배포·가입·결제 변경은 이번 작업에서 실행하지 않았다.
3. 실제 HTTPS 기본 주소가 생기면 토스 로컬 빌드 설정의 `VITE_TOSS_WORD_AUDIO_BASE_URL=https://실제주소/word-audio/`에 지정하고 일반 빌드로 검사한다. 공개 경로이며 키나 토큰을 넣지 않는다. 주소 미설정 시 버튼을 숨겨 기존 배포에 동작하지 않는 표본 버튼이 노출되지 않게 한다.
4. 사용자가 토스 번들을 생성/업로드해 Android·iPhone 재생, 느린 재생, 무음 모드, 음량, 다른 음악/전화·광고와의 오디오 포커스, 백그라운드 중지를 확인한다. 표본 채택 후 전체 음성 생성 및 최종 고지·전체 용량 검사를 진행한다.
