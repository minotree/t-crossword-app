# 그림책 영어 낭독

## Cloudflare 정적 음성 배포 확인 · 2026-10-30

사용자가 `crossword-content-audio`에 정적 파일 175개를 직접 업로드했다. 공개 주소는 https://crossword-content-audio.minotree0902.workers.dev/ 이다. 그림책 119개는 `/picture-book-audio/`, 응원 문구 50개는 `/encouragement-audio/`이며 각 디렉터리의 manifest.json을 함께 제공한다.

`scripts/check-content-audio-remote.py`로 공개 파일 174개(_headers 제외)의 HTTP/바이트 해시와 MP3 169개의 MIME/CORS/immutable, 두 manifest의 CORS를 검사했다. 결과는 `content-audio-remote-validation.json`에 기록했다. Python 기본 User-Agent는 403을 받아 브라우저 User-Agent로 검사했다. 원본 이미지 복원으로 달라진 source JSON은 생성 당시 백업과 비교해 이미지 경로만 변경됐음을 확인한 뒤 119개 원문/해시/디코딩 검사도 통과했다. 생성 당시 보고서 해시를 임의로 갱신하지 않았다.

세 앱의 그림책 재생 주소 기본값을 이 배포본으로 연결했다. VITE_PICTURE_BOOK_AUDIO_BASE_URL이 비었거나 없으면 기본 주소를 사용하고, 값이 있으면 별도 HTTPS 주소로 재정의할 수 있다. 토스 응원 문구도 이 호스트로 연결했다. 기존 단어장 프로젝트와 주소는 유지한다. 앱 재배포와 실제 기기 청취는 별도이며, 기존 음성/앱 정적 파일을 임의로 삭제하지 않았다. 아래 업로드 전·주소 미설정 설명은 이전 이력이다.

## 최신 듣기 UI · 2026-10-30

사용자 후속 결정으로 이전 0.7배속·1/3/5/계속 반복 선택 UI를 제거했다. 현재 버튼은 `듣기`(1회)와 `연속듣기`이며, 연속듣기 모달에서 5회/10회를 선택해 일반 속도로 재생 후 종료한다. 반복 사이 1초 쉼·이동/숨김/중지 시 취소는 유지한다.

토스는 기존 전면형 광고 어댑터의 show가 종료된 뒤 횟수 모달을 표시한다. 기존 새 퍼즐 정책과 같이 광고 미준비·미지원·실패 시에는 광고 없이 모달로 진행한다. 웹/모바일에는 광고 SDK가 연결되어 있지 않아 모달을 바로 표시한다. 음성 주소 미설정 상태에서도 새 버튼·횟수 모달은 확인할 수 있지만 실제 재생 선택은 비활성이다. 업로드 주소 연결은 별도다. 아래 0.7배속/계속 반복 설명은 이전 구현 이력이다.

## 2026-10-30 앱 재생 제어 준비

후속 반복 기능: 현재 페이지를 1회(기본)·3회·5회·계속 반복할 수 있다. 횟수는 첫 재생을 포함한 총 횟수이며 재생 사이 1초 쉰다. 같은 audio 요소/MP3를 재사용하고 일반/0.7배속을 유지한다. 현재 회차를 표시한다. 횟수를 바꾸면 기존 재생을 멈추고 다음 듣기부터 적용한다. 중지·페이지/작품/메뉴 이동·백그라운드 전환 시 대기 타이머까지 취소한다. 다음 페이지 자동 재생은 하지 않는다. 회차와 반복 선택은 페이지가 바뀌면 초기화된다.

사용자 선택으로 웹·토스·모바일 읽기 화면에 일반(1.0)·느리게(0.7) 듣기를 제공한다. 동일 MP3의 playbackRate만 바꾸고 preservesPitch를 요청하므로 별도 음성 파일/재생 URL이 추가되지 않는다. 응원 문구는 일반 듣기만 유지한다.

각 앱의 `VITE_PICTURE_BOOK_AUDIO_BASE_URL`에 정적 MP3와 manifest.json이 함께 있는 HTTPS 디렉터리 주소를 지정한다. 예: `https://example.com/picture-book-audio/`. 주소 미설정 시 ‘음성 업로드 준비 중’과 비활성 버튼을 표시한다. 생성·검사가 끝난 최종 Qwen 초급/중급 + 기존 고급 manifest를 업로드하고 HTTP/CORS/원문/해시 검증 후 주소를 설정해야 한다. 현재 버튼 준비를 원격 업로드·실제 재생 완료로 간주하지 않는다.

클릭할 때만 manifest를 요청하고 현재 페이지 ID·영어 원문·해시 파일명 대응을 확인한다. 임의 외부 URL/경로는 허용하지 않는다. 페이지/작품/메뉴 이동과 백그라운드 전환 시 요청과 재생을 중지하고 지연 15초 제한·오류 재시도를 제공한다. 실제 브라우저·모바일 음정 보존/음량/오디오 포커스는 별도 기기 검증이다. 웹 서비스워커에 음성 일괄 캐싱은 추가하지 않았다.

2026-10-29: 초급 45편·45페이지, 중급 9편·36페이지, 고급 7편·38페이지의 영어 **본문만** 페이지별 MP3로 제작한다. 제목·한글 해석은 낭독하지 않는다. 원본 텍스트·줄바꿈을 입력하고 별도 무음은 삽입하지 않는다. 모델의 문장·행 구분에 따른 쉼은 포함된다. 원본 그림책이나 앱 UI는 변경하지 않는다.

전체 119개 생성·기술 검증 완료: MP3 16,368,000 bytes, 총 2,046초(34분 6초), ZIP 14,401,616 bytes. 청취 검수·기기 검증·앱 연결·배포는 미실행이다.

## 연령 느낌 음성 후보 (2026-10-29)

### Qwen 선택 음성과 후속 제작

사용자는 Kokoro 후보를 채택하지 않고 직접 Qwen3-TTS VoiceDesign에서 생성·청취한 초급/중급 목소리를 승인했다. 사용자 지정 `D:/Download/audio_12.wav`(초급, 4.32초), `audio_17.wav`(중급, 11.12초)를 `references/beginner.wav`, `references/intermediate.wav`에 복사해 보존한다. 시각·바이트 크기는 Gradio 임시 결과와 대응한다. 선택한 설명·입력 문장·전체 해시·생성 경위는 `selected-voices.json`에 기록한다. 입력 문장은 대화에서 제공한 테스트 본문 기준이며 청취 전사 검증은 별도다.

초급은 12세 전후의 낮은 중음역·차분한 낭독, 중급은 16~17세와 `college student` 표현을 함께 사용한 설명을 선택했다. 실제 아동/청소년 녹음을 사용하지 않았으며 나이는 합성 목소리의 인상이다. 샘플 승인은 전체 낭독·재현 음성의 승인과 구분한다.

`scripts/generate-qwen-picture-book-audio.py`는 공식 `Qwen/Qwen3-TTS-12Hz-1.7B-Base`의 `create_voice_clone_prompt`/`generate_voice_clone`를 사용해 합성 기준 음성을 재사용한다. 선택 음성 재현용 Base 모델은 VoiceDesign과 별도 모델이다. 모델·토크나이저 다운로드 파일 전체 해시와 고정 리비전은 `qwen-model-provenance.json`에 남긴다. 기존 Qwen 가상환경·Kokoro 환경은 변경하지 않으며 MP3 인코더만 기존 Kokoro 환경에서 호출한다. GPU 사용 가능 여부는 기존 Qwen 환경에서 `torch.cuda.is_available() == False`로 확인되어 CPU/float32로 실행한다.

```powershell
# 사용자 로컬 Qwen 설치 위치의 Python 사용. 프로젝트 공통 필수 경로가 아니다.
D:/DEV/qwen3-tts/.venv/Scripts/python.exe scripts/generate-qwen-picture-book-audio.py --references
D:/DEV/qwen3-tts/.venv/Scripts/python.exe scripts/generate-qwen-picture-book-audio.py --download
D:/DEV/qwen3-tts/.venv/Scripts/python.exe scripts/generate-qwen-picture-book-audio.py --limit 1
D:/DEV/qwen3-tts/.venv/Scripts/python.exe scripts/generate-qwen-picture-book-audio.py
artifacts/tts-venv/Scripts/python.exe scripts/check-picture-book-audio.py --qwen
```

새 제작 파일은 `artifacts/picture-book-audio-qwen/`에 격리한다. 기존 Kokoro 세트·ZIP·manifest는 보존한다. 전체 완료 시 `qwen-manifest.json`과 `qwen-generation-report.json`, 새 미리보기·ZIP을 준비하며 고급 MP3·메타데이터는 기존 파일과 같아야 한다. 페이지별 체크포인트는 원문·모델·기준 음성·설정을 비교해 재사용한다. 오류가 나면 기존 완료 파일을 유지하고 중단한다. 본문 낭독 누락·오독·단어 반복과 목소리 일관성은 별도 청취 검수한다.

첫 페이지 CPU 시험은 성공했다. 9.336초 MP3(74,688 bytes)의 추론·인코딩에 57.52초가 걸렸고, 디코딩·비무음·길이 검사를 통과했다. 샌드박스 실행은 결과 없이 종료되어 일반 실행 환경에서 다시 시험했으며 성공했다. 이후 `scripts/run-qwen-picture-book-job.py`를 숨김 백그라운드 작업으로 시작했다. 이 스크립트는 전체 생성 후 `check-picture-book-audio.py --qwen`까지 순서대로 수행하고 `job-status.json`에 `generating` / `validating` / `complete` / `failed` 상태를 기록한다. 현재 전체 완료·검증 통과를 의미하지 않는다. `job.log`에 오류와 페이지별 생성 시간을 남긴다. 중단·실패한 작업은 원인을 해결한 뒤 같은 실행기로 재시작하며 기존 체크포인트를 재사용한다. 중복 실행하지 않는다.

```powershell
Get-Content artifacts/picture-book-audio-qwen/job-status.json
Get-Content artifacts/picture-book-audio-qwen/progress.json
Get-Content artifacts/picture-book-audio-qwen/job.log -Tail 15
```

공식 [모델](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base) 및 [코드](https://github.com/QwenLM/Qwen3-TTS)는 Apache-2.0 고지를 따르며, 원문 라이선스를 `QWEN-APACHE-2.0.txt`와 새 정적 묶음에 포함한다. 생성물의 권리·비침해를 자동 보장하지 않으며 실제 인물 목소리 참조는 없다. 앱 연결·호스팅 변경·배포는 이 제작 스크립트에서 수행하지 않는다.

사용자는 초급에 어린이처럼, 중급에 청소년처럼 들리는 목소리를 원하며 고급은 현재 `af_heart`를 유지한다. Kokoro 공식 목록은 어린이/청소년 나이를 보증하지 않으므로 `af_sky`·`af_bella`를 **미선정 후보**로 현재 `af_heart`와 비교한다. 후보가 요청한 나이처럼 들린다고 확인한 상태는 아니다. 피치·재생 속도는 변경하지 않는다. 전체 119개 음성과 기존 미리보기는 교체하지 않는다.

`scripts/preview-picture-book-voices.py --download`는 기존 모델과 동일한 고정 리비전에서 공식 음성 파일을 받으며 공식 VOICES.md의 SHA-256 접두어와 대조한다. 음성별 전체 해시·출처·입력 본문·MP3 해시는 `voice-audition.json`에 남긴다. 기존 모델 라이선스·권리 검토 범위가 적용되며 실제 어린이/청소년의 녹음을 참조하지 않는다.

```powershell
artifacts/tts-venv/Scripts/python.exe scripts/preview-picture-book-voices.py --download
artifacts/tts-venv/Scripts/python.exe scripts/preview-picture-book-voices.py
python -m http.server 4188 --bind 127.0.0.1 --directory artifacts/picture-book-voice-preview/public
```

미리보기: `artifacts/picture-book-voice-preview/public/index.html`. 초급 첫 작품 및 중급 첫 작품 본문에 각각 3개 음성을 사용한다. 청취 후 후보가 부적절하면 다른 음성/모델을 검토한다. 후보 생성 성공을 성우 선정이나 청취 승인으로 기록하지 않는다.

## 제작과 권리 기록

- 기존 단어장 제작 환경을 재사용한다. Kokoro Python 0.9.4, `hexgrad/Kokoro-82M` v1.0, 미국 영어 `af_heart`, CPU eval, speed 1, 24kHz mono, MP3 64kbps. 별도 유료 API나 음성 복제 참조 자료를 사용하지 않는다.
- 입력은 `content/beginner-poems/poems.json`의 `poem`, `content/intermediate-readings/books.json` 및 `content/advanced-readings/books.json`의 `pages[].text`다. `approved` 작품만 허용한다. 창작 경위와 기존 검토 범위는 각 원본 디렉터리 README 및 [최종 검토 기록](../picture-book-final-review-2026-10-19.md)을 따른다.
- 별도 지시 프롬프트 없이 manifest의 영어 본문을 그대로 TTS에 입력한다. `manifest.json`에 작품 ID·페이지 번호·본문·본문 해시·발음 기호·음성 바이트 해시를 남긴다. `generation-report.json`에 날짜·모델/음성 해시·원본 파일 해시·생성 스크립트 해시·설정을 기록한다.
- 2026-10-29 [공식 모델 카드](https://huggingface.co/hexgrad/Kokoro-82M)의 Apache-2.0 및 상용/개인 배포 안내를 재확인했다. 기존 [단어장 권리 확인 기록](../word-audio/README.md)의 모델·음성 출처, 학습 자료 고지 및 한계를 따른다. 라이선스 원문은 미리보기/ZIP에도 포함한다. 모델 라이선스가 개별 생성물의 비침해나 독점적 권리를 보장한다고 해석하지 않는다.
- 기술 검사와 청취 검수는 별도다. 발음·억양·문장 연결의 청취 검수 및 실제 기기 검증은 대기 상태이며, 그림책 자체의 기존 승인 상태를 음성 승인으로 간주하지 않는다.

## 실행과 산출물

기존 `artifacts/tts-venv`와 `artifacts/tts-cache`가 필요하다. 모델·도구를 앱 런타임에 포함하지 않는다. 생성 중 중단되면 동일 명령으로 체크포인트를 검증하고 이어서 생성한다. 실패한 페이지가 있으면 전체 manifest를 갱신하지 않는다.

```powershell
artifacts/tts-venv/Scripts/python.exe scripts/prepare-picture-book-audio.py
artifacts/tts-venv/Scripts/python.exe scripts/check-picture-book-audio.py
python -m http.server 4187 --bind 127.0.0.1 --directory artifacts/picture-book-audio/public
```

- 미리보기: `http://127.0.0.1:4187` 또는 `artifacts/picture-book-audio/public/index.html`
- MP3: `artifacts/picture-book-audio/public/picture-book-audio/`
- 정적 호스팅용 ZIP: `artifacts/picture-book-audio.zip`
- 제작·검증 기록: 이 디렉터리의 `manifest.json`, `generation-report.json`, `validation.json`
- 파일명은 작품·페이지 ID와 실제 MP3 SHA-256 앞 16자다. 본문 변경 시 원본/manifest 대응 검사를 다시 수행하고 재생성·청취 검토한다. 예전 MP3는 임의 삭제하지 않는다.

자동 검사는 원본 전체 페이지의 누락·중복, 원문/해시/파일명/바이트, MP3 디코딩·길이·유한값·비무음, 발음 기호 누락 및 ZIP 대응을 확인한다. 발음 기호 존재만으로 정확한 발음이나 전체 원문 낭독을 보장하지 않는다. 앱 연결·Cloudflare 업로드·배포는 수행하지 않는다. ZIP은 기존 단어장 호스팅 파일을 포함하지 않으므로 기존 호스팅에 그대로 교체 업로드하지 않는다.
