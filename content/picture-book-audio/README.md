# 그림책 영어 낭독

## Cloudflare 수동 업로드 방법 · 2026-10-31

현재 Worker의 대시보드에서 56MB ZIP을 업로드했을 때 ZIP 자체가 단일 파일의 25MiB 제한에 걸리는 것을 사용자 화면으로 확인했다. 이 화면에서는 `artifacts/picture-book-title-audio/public` **폴더 하나를 통째로** 업로드 영역에 넣는다. 폴더 안의 `picture-book-audio/`, `beginner-chants/`, `encouragement-audio/`와 manifest·라이선스·`_headers` 등이 배포 루트에 유지되어야 한다. ZIP을 단일 공개 파일로 올리거나 여러 최상위 항목을 따로 선택하는 안내는 이 화면에 맞지 않는다. ZIP은 보관·전달용으로 유지한다. 사용자는 이 방식으로 배포 완료를 알렸다.

공개 반영은 `python scripts/check-picture-book-title-audio-remote.py`로 확인한다. 사용자 배포 후 현재 통합 폴더의 `_headers`를 제외한 341개 공개 파일·333개 MP3의 HTTP·바이트 해시·MIME/CORS/immutable와 manifest CORS를 전부 확인했고 실패는 0건이다. 원격 그림책 manifest가 제목 포함 119페이지의 로컬 manifest와 바이트 단위로 같음을 확인했다. 결과는 `title-remote-validation.json`에 기록했다. 샌드박스 네트워크 접근은 차단되어 권한 승인 후 검사를 통과했다. 아래 미배포 기록은 묶음 생성 당시의 상태다.

배포 후 사용자가 “잘 들리네”라고 청취 성공을 확인했다. 토스 앱 갱신 없이 원격 음성 변경 후 재생을 확인한 사용자 보고로 기록하며, 청취한 작품·기기/OS·119페이지 전수 발음 검수·연속듣기/백그라운드 동작까지 확인한 것으로 확대하지 않는다. 자동 보고서의 `listeningReview: pending`은 전수 청취 검토가 남았음을 뜻한다. 웹/PWA·Android/iOS별 기기 검증은 별도로 남는다.

## 고급 제목 낭독 및 도구 복구 완료 · 2026-10-31

후속 사용자 요청으로 고급 38페이지도 기존 Kokoro `af_heart` 목소리로 제목을 생성했다. 최종 묶음은 초급 45·중급 36·고급 38페이지 모두 제목 → 0.5초 쉼 → 기존 본문이며, `title-manifest.json`의 119개 항목이 `title-then-body`다. 초급·중급 81개 MP3는 이전 제목 포함 묶음과 바이트 해시가 같으며 다시 합성하지 않았다. 고급도 본문은 기존 MP3를 사용한다. 아래 고급 보류 기록은 최초 단계의 이력이다.

CodeIntegrity 로그의 3033/3077 이벤트로 Thinc 8.3.14 DLL 차단을 확인했다. 기존 `artifacts/tts-venv`를 보존한 채 `artifacts/kokoro-title-runtime`을 별도로 만들었다. spaCy 3.8.16의 요구 범위(`thinc>=8.3.12,<8.4.0`)를 만족하는 [공식 Thinc 8.3.13](https://pypi.org/project/thinc/8.3.13/)을 설치했고, 추가로 차단된 blis 1.3.4는 Thinc 요구 범위 내의 [공식 blis 1.3.0](https://pypi.org/project/blis/1.3.0/)으로 교체해 import·실제 합성에 성공했다. Windows 보안 정책·서명·기존 바이너리는 변경하지 않았다. 모델·목소리 해시는 기존 제작 기록과 대조했다.

복구 버전·wheel 다운로드 URL/해시는 `kokoro-title-runtime.json`, 로컬 환경 패키지 목록은 `kokoro-title-requirements.txt`에 기록한다. 새 가상환경은 기존 전역 PyTorch 등을 재사용하는 `--system-site-packages` 방식이다. 재구성이 필요하면 별도 가상환경에서 요구 목록을 설치하며 원래 환경을 덮어쓰지 않는다. 공식 설치 지침은 [spaCy 문서](https://spacy.io/usage.html)를 참조한다. `pip check`는 상속한 전역 `aider-chat`의 기존 의존성 불일치 4건으로 실패했고 전역 Python에서도 동일함을 확인했다. 음성 도구의 import·38개 실제 합성·최종 음원 검사는 통과했으며 무관한 전역 패키지는 변경하지 않았다.

```powershell
# 전체 작업: Qwen 81개 체크포인트 재사용 → 고급 제목 생성 → 통합 검사/ZIP
D:/DEV/qwen3-tts/.venv/Scripts/python.exe -u scripts/prepare-picture-book-title-audio.py
# 고급 제목만 생성할 경우
artifacts/kokoro-title-runtime/Scripts/python.exe -u scripts/prepare-picture-book-title-audio.py --engine kokoro
# 생성된 제목을 전체 119페이지에 결합하고 검사/ZIP만 수행할 경우
artifacts/tts-venv/Scripts/python.exe -u scripts/prepare-picture-book-title-audio.py --engine package
```

위 경로는 현재 PC의 기존 환경 예시다. 전체 작업의 Kokoro Python은 `--kokoro-python`으로 지정할 수 있다. 초급·중급만 필요하면 이전 `--defer-advanced` 옵션도 유지한다.

최종 `artifacts/picture-book-title-audio.zip`은 56,188,719 bytes이며 342개 정적 파일·333개 MP3(기존 214+제목 포함 119)를 담는다. 이전 81개 제목 묶음은 `artifacts/picture-book-title-audio/snapshots/beginner-intermediate/`에 ZIP·manifest·보고서로 보존했다. 최종 원본/본문/제목·무음·디코딩·기존 파일 보존·ZIP 검사는 통과했다. 정적 업로드·원격 검사·제목 발음/연결의 청취 검토·실제 기기 검증은 미실행이다. 업로드할 파일 경로와 청취 화면은 아래와 같다.

## 제목 낭독 추가 · 2026-10-31

사용자 요청으로 `듣기`·`연속듣기`의 각 회차를 영어 제목 → 0.5초 쉼 → 기존 영어 본문으로 변경한다. 첫 페이지는 작품 제목과 서로 다른 페이지 소제목을 차례로 읽고, 이후 페이지는 해당 페이지 제목을 읽는다. 동일한 작품 제목·페이지 제목은 한 번만 읽는다. 한글 해석·챈트는 변경하지 않는다.

초급 45페이지·중급 36페이지의 제목은 기존에 승인한 Qwen 합성 기준 목소리와 고정 Base 모델로 생성한다. 기존 본문 MP3를 디코딩해 그대로 뒤에 결합하고 24kHz mono/64kbps MP3로 재인코딩한다. 본문 자체를 다시 합성하지 않는다. 생성 입력·모델 리비전·기준 음성 해시·생성 시각은 제목 체크포인트와 최종 manifest의 `titleGeneration`에 기록한다. 기존 라이선스·모델 출처·권리 검토 한계는 아래 기록을 따른다.

고급 38페이지는 Kokoro 실행 중 `thinc.backends.numpy_ops` DLL이 Windows 실행 정책으로 차단됐고 권한 상승 실행에서도 동일하게 실패했다. 사용자 결정으로 초급·중급부터 준비하고 고급은 도구 복구 후 진행한다. `--defer-advanced`는 고급 manifest 항목·음성 파일을 그대로 유지한다. 정책을 우회하거나 의존성을 재설치하지 않았다.

```powershell
D:/DEV/qwen3-tts/.venv/Scripts/python.exe -u scripts/prepare-picture-book-title-audio.py --defer-advanced
```

이 Python 경로는 현재 PC에 설치된 기존 환경의 예시다. 스크립트의 Qwen/Kokoro 개별 단계는 해당 환경의 Python으로 `--engine qwen` / `--engine kokoro`를 실행할 수 있고, 결합·검사는 기존 음성 인코딩 환경에서 `--engine package --defer-advanced`로 실행한다. 체크포인트는 입력 설정·WAV 해시가 일치할 때만 재사용한다. 실패하면 완료 항목을 보존한 채 같은 명령으로 이어서 진행한다. 동시에 중복 실행하지 않는다.

최종 정적 폴더는 `artifacts/picture-book-title-audio/public/`, 업로드 묶음은 `artifacts/picture-book-title-audio.zip`, 청취 화면은 `public/title-preview.html`이다. 기존 Cloudflare 배포본의 그림책·챈트·응원·라이선스 파일을 모두 보존하고 그림책 manifest만 새 해시 파일명으로 연결한다. 기존 앱이 원격 manifest를 재요청하므로 앱 코드 수정·앱 재빌드 없이 정적 업로드 후 반영된다. 다른 `VITE_PICTURE_BOOK_AUDIO_BASE_URL`을 쓰는 환경은 해당 호스트도 별도 갱신해야 한다. 이 스크립트는 업로드하지 않는다.

검사는 원본 119페이지와 기존 본문 파일 해시·제목 대응·MP3 디코딩·결합 사이 500ms 무음·이전 221개 파일 보존·ZIP 바이트 해시를 확인한다. 전체 결과는 `title-generation-report.json`, 최종 119페이지 manifest는 `title-manifest.json`에 기록한다. `--engine package --limit 1 --defer-advanced`는 1페이지 시험 묶음이며 콘텐츠의 최종 manifest를 갱신하지 않는다. 전체 생성·실제 배포·제목 발음·목소리 연결·기기 청취 검증 여부는 보고서와 `progress.md`를 따른다. 아래 본문만 낭독 정책은 이전 제작 이력이다.

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
