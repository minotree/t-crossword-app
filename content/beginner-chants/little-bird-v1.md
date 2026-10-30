# Little Bird — 챈트 제작 시안 v1

- 제작일: 2026-10-30 (Asia/Seoul)
- 상태: `draft-unreviewed` — 로컬 음원 시안 생성, 청취 미검수
- 원본: `../beginner-poems/poems.json`, 작품 ID `beginner-01`
- 제작 방식: 프로젝트 원문 네 줄을 수정 없이 반복하는 영어 리듬 챈트
- 이번 작업: Codex에서 가사 배치·박자·녹음 지시 작성. 구체적인 모델 식별자는 도구에서 제공되지 않음.
- 외부 음악·녹음·참조 멜로디: 사용하지 않음
- 비용: 시안 제작에 결제·유료 API 호출 없음. 실제 앱 배포에 필요한 권리 검토는 미완료.

## 가사와 뜻

| 행 | 영어 원문 | 뜻 |
|---|---|---|
| A | Little bird, sing with me. | 작은 새야, 나와 함께 노래하자. |
| B | Little tree under the sky. | 하늘 아래 작은 나무. |
| C | Little bee, fly with me. | 작은 벌아, 나와 함께 날자. |
| D | Come and play under the sky. | 와서 하늘 아래 함께 놀자. |

B는 원문 그대로의 묘사 구절이다. 새 문장이나 후렴 가사를 추가하지 않는다. 위 해석은 챈트 제작용이며 그림책의 기존 해석은 변경하지 않는다.

## 박자와 발성

- 4/4박자, 80 BPM. 한 박은 0.75초, 한 마디는 3초.
- 각 문장은 두 마디(6초)에 배치한다. 두 번째 마디 끝에는 숨 쉴 여유를 둔다.
- 편안한 중음역에서 말하듯 리듬을 탄다. 구체적인 음정·멜로디는 아직 작곡하지 않았다.
- `little`을 포함해 단어를 과도하게 끊지 않고, `bird`와 `bee`의 끝소리와 모음 차이가 들리게 한다.
- 배경은 작은 타악기와 2·4박 손뼉 정도로 단순하게 구성한다. 목소리를 가리는 효과음은 피한다.
- 아래 배치는 녹음용 시작점이며 실제 발음과 청취에 따라 조정한다. 대문자는 강조 지점이며 가사 철자 변경이 아니다.

| 행 | 첫 마디: 1 / 2 / 3 / 4박 | 둘째 마디: 1 / 2 / 3 / 4박 |
|---|---|---|
| A | LIT-tle / BIRD / 쉼 / 쉼 | SING / with / ME / 쉼 |
| B | LIT-tle / TREE / 쉼 / 쉼 | UN-der / the / SKY / 쉼 |
| C | LIT-tle / BEE / 쉼 / 쉼 | FLY / with / ME / 쉼 |
| D | COME / and / PLAY / 쉼 | UN-der / the / SKY / 쉼 |

## 녹음 진행표: 총 42초

첫 시안은 각 문장을 한 마디(3초)에 배치한다. 위 두 마디 연습표에서 쉼을 줄이고 두 구절을 각각 1–2박과 3–4박에 연결한다. 급하게 들리면 문장마다 두 마디를 주는 78초 대안으로 전환하며 발음을 희생해 시간을 맞추지 않는다.

| 시간(초) | 진행 |
|---|---|
| 0–3 | 전주 |
| 3–6 / 6–9 | 선창 A / 응답 A |
| 9–12 / 12–15 | 선창 B / 응답 B |
| 15–18 / 18–21 | 선창 C / 응답 C |
| 21–24 / 24–27 | 선창 D / 응답 D |
| 27–39 | 함께 A → B → C → D, 각 3초 |
| 39–42 | 마무리 |

## 보컬용 가사

아래 12행만 발성한다. 선창과 응답의 차이는 음색이나 녹음 트랙으로 구별하며 진행 안내는 노래하지 않는다.

```text
Little bird, sing with me.
Little bird, sing with me.
Little tree under the sky.
Little tree under the sky.
Little bee, fly with me.
Little bee, fly with me.
Come and play under the sky.
Come and play under the sky.
Little bird, sing with me.
Little tree under the sky.
Little bee, fly with me.
Come and play under the sky.
```

## 음원 제작 지시문 초안

다음은 향후 도구 또는 녹음자에게 전달할 초안이며 외부 서비스에 제출하지 않았다. 생성 도구를 선택하면 해당 도구의 입력 방식에 맞춰 조정한다.

```text
Create an original spoken-rhythm English learning chant, in 4/4 at 80 BPM.
Use a clear, warm voice in a comfortable middle register, light percussion,
and gentle claps. Keep the words prominent and the English stress natural.
Do not imitate an existing song, artist, or identifiable person's voice.
Use only the supplied 12 lyric lines, in order, with no extra spoken words.
Start with one bar of percussion. Give each lyric line one bar.
The first eight lines alternate a leader and a response voice.
The final four lines are sung or chanted together.
Finish with one bar of percussion. Target duration: 42 seconds.
If one bar per line harms intelligibility, use two bars per line instead
and deliver a clearly identified 78-second alternate version.
Do not read instructions or section labels aloud.
```

## 제작·권리와 검수 기록

- 프로젝트 원문의 제작·권리 기록은 `../beginner-poems/README.md` 및 연결된 검토 문서를 따른다. 이번 챈트의 배포 승인을 뜻하지 않는다.
- 가사에 추가 어휘가 없으므로 원본 초급 범위를 확대하지 않는다. 반복을 새 어휘로 집계하지 않는다.
- 외부 서비스·모델·음성·반주 샘플을 선택하면 도구명, 모델/버전, 공식 이용 조건 URL, 확인일, 앱 내 상업적 배포·재배포 가능 여부, 필수 고지를 기록한다.
- 실제 녹음자를 쓰면 녹음물의 앱 배포·편집 이용 동의를 별도로 확보한다.
- 음원 생성 후 실제 입력 프롬프트·설정·파일 경로·해시·길이·생성일을 추가한다.
- 미실행: 작곡·보컬/반주 녹음·음원 합성·원문 대조 청취·유사성 검토·휴대전화 청취·앱 연결·배포.
- 검수 기준: 12행 순서/누락/추가, bird/bee 구분, 자연스러운 강세, 따라 부를 속도, 목소리/반주 균형, 시작·끝 잘림, 반복 경계.

## 다음 제작 단계

2026-10-30 공식 자료 확인:

- [ACE-Step 1.5 모델 카드](https://huggingface.co/ACE-Step/Ace-Step1.5)는 MIT 라이선스와 생성 음악의 상업적 사용 가능을 명시한다. 이는 개별 결과의 비침해나 독점 권리를 보장하지 않는다. 앱 배포 전 실제 생성 모델·필수 고지와 결과를 추가 검토한다.
- [공식 무료 데모](https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5)는 ZeroGPU에서 실행 중이었다. 무료 실행 가능 여부는 대기열·할당량·인증 조건에 좌우되며 실행 성공은 별도 확인한다.
- [Suno 공식 안내](https://help.suno.com/en/articles/2410177)는 무료 플랜 생성곡을 비상업적 용도로 제한한다. 앱 배포용 무료 제작 경로로 채택하지 않았다.

`try-official-demo.py`는 공식 데모에 42초·80 BPM·1개 생성을 요청하는 실행기다. 가사와 제작 지시가 외부 공식 데모로 전송되며 API 토큰·유료 엔드포인트를 사용하지 않는다. 실제 모델 요청명·전체 입력·결과/오류는 `artifacts/beginner-chants/official-demo-attempt.json`에 기록한다. 생성 성공과 청취 검수는 구분한다.

### 첫 공식 데모 실행 결과

2026-10-30 공식 `/config` 접속과 생성 API 호출을 시도했다. 설정의 기본 모델은 `acestep-v15-xl-turbo`였다. 완료 결과가 수 분 동안 반환되지 않아 로컬 대기를 중단했다. 대기열/생성 중 어느 단계에서 멈췄는지는 확인하지 못했으며 서버 작업 취소 여부도 확인하지 못했다. 음원 파일은 확보하지 못했다. 이 첫 실행에는 실행 전 보고서 저장이 없었으므로 JSON 실행 보고서는 남지 않았다. 후속 실행기는 요청 전 입력 저장과 SSE 대기 180초 제한을 추가했다. 서버 작업 종료 확인 없이 자동 반복 요청하지 않는다.

재실행 명령: 저장소 루트에서 `python content/beginner-chants/try-official-demo.py`. 공개 데모 접근 제한 시 우회하지 않고 공식 웹 화면에서 인증·무료 할당량을 확인한다. 생성 데모에서 실제 사용하는 XL 모델의 별도 모델 카드·라이선스 대응은 배포 전에 추가 확인해야 한다.

## 2026-10-30 로컬 음원 시안

- 파일: `artifacts/beginner-chants/little-bird-local-v1.wav` (8,064,044바이트, SHA-256 `6452e72ea1ff9930d1e281b5e03e42d4040a706d35de4cf52ac93f25f0111d7d`). 생성 원본과 실행 보고서는 `artifacts/beginner-chants/local-v1/`에 보존한다. 산출물은 Git에 포함하지 않는다.
- 생성 모델: [ACE-Step 1.5](https://huggingface.co/ACE-Step/Ace-Step1.5)의 `acestep-v15-turbo`, 모델 리비전 `19671f406d603126926c1b7e2adc169acbcade22`, 코드 리비전 `ca1e85fe9430179831e6bc6be790c332190a3866`. 프로젝트 코드와 모델은 MIT로 안내되며 배포 형태에 필요한 고지를 확인한다.
- 입력 프롬프트: `English learning spoken rhythm chant, 80 bpm, warm clear voice, gentle percussion and claps, simple cheerful accompaniment. Lead and response phrases followed by everyone together. Clear English pronunciation. Only the supplied lyrics.` 가사는 위 보컬용 12행이며 참조 음원은 사용하지 않았다.
- 환경: 로컬 AMD Radeon RX 9060 XT, ROCm 7.2 PyTorch, float32, CPU offload, 시드 20261030, 8회 추론, 42초 요청. 모델 다운로드 외에 생성 API 호출·결제 없음.
- 별도 1.7B 로컬 언어 모델을 이용한 첫 시도는 오디오 코드 생성 단계에서 여러 분 동안 완료되지 않아 중단했다. 최종 음원은 언어 모델을 끈 음악 모델 직접 생성 결과다. float16 직접 생성은 NaN 오류로 실패해 float32로 다시 생성했다. 단일 GPU 추론을 위해 Windows ROCm의 분산 학습 미지원 의존성에 실행기에서 오류 발생형 스텁을 적용했다.
- 기술 검사: WAV 디코딩, 48kHz·스테레오·42.0초, 최대 진폭 0.89127, RMS 0.14625, SHA-256 확인. 기술 검사만으로 노래의 가사·발음·품질이나 곡의 독창성을 보장하지 않는다.
- 미완료: 실제 청취로 가사 12행의 누락·반복 순서·발음, 따라 부르기 간격, 음악의 적합성 및 기존 곡과의 유사성을 검수해야 한다. 이 음원은 시안이며 앱에 연결하거나 배포하지 않았다.

## 2026-10-30 어린이 합창 느낌 시안

- 사용자 요청으로 유아 연령대의 밝고 자연스러운 여러 목소리와 가벼운 손뼉·타악기 느낌을 지정해 기존 곡과 별도 생성했다. 실제 아동 음성이나 음성 참조는 사용하지 않았다.
- 파일: `artifacts/beginner-chants/little-bird-children-v1.wav` (8,064,044바이트, SHA-256 `427d8b260b92f8a127114d36d11d463ca25dd790bf9794b1b4c82d52ba30ed9e`). 원본과 생성 보고서는 `artifacts/beginner-chants/local-children-v1/`에 있다.
- 실제 프롬프트: `English learning chant, 80 bpm, bright natural preschool-age children voices singing together, small kids choir, playful call and response, clear English pronunciation, gentle handclaps and light percussion, simple cheerful melody, vocals prominent. Only the supplied lyrics. No imitation of real people or existing songs.` 가사, 모델 리비전, 설정, 시드는 앞선 시안과 같다.
- 기술 검사: WAV 디코딩, 48kHz·스테레오·42.0초, 최대 진폭 0.89124, RMS 0.14924, 해시 확인. 목소리의 나이 느낌·합창 여부·가사와 발음은 청취 미검수다.
- 기존 초급 그림책 낭독은 사용자가 선택한 Qwen 합성 기준 음성을 사용하며, 12세 전후·낮은 중음역·차분한 낭독으로 기록돼 있다(`../picture-book-audio/selected-voices.json`). 새 챈트는 이 음성을 참조하거나 재현하지 않았으며 동일한 목소리라고 주장하지 않는다. 사용자 승인·유사성 검토·앱 연결·배포는 미완료다.

## 2026-10-30 더 어린 목소리와 경쾌한 리듬 시안

- 사용자 요청에 따라 어린 유아 합창 인상, 통통 튀는 리듬, 가벼운 손뼉·우쿨렐레·타악기를 지정한 별도 시안. 합성 목소리이며 참고 음원은 사용하지 않았다.
- 파일: `artifacts/beginner-chants/little-bird-younger-v1.wav` (8,064,044바이트, SHA-256 `6a419d554315360808e018c6e7f1d70b5977bbc0ce4a738a4008e6bc382cb00f`). 원본과 생성 보고서는 `artifacts/beginner-chants/local-younger-v1/`에 보존한다.
- 실제 프롬프트: `English learning chant, 80 bpm, very youthful preschool children voices, bright playful little kids choir singing together, bouncy lighthearted rhythmic melody with lively call and response, clear English words at an easy pace, gentle claps, ukulele and light percussion, upbeat and bubbly, vocals upfront, warm natural sound, no squeaky cartoon effects. Only the supplied lyrics. No imitation of real people or existing songs.` 가사와 모델·설정·시드는 앞선 시안과 같다.
- 기술 검사: WAV 디코딩, 48kHz·스테레오·42.0초, 최대 진폭 0.89124, RMS 0.14988, 해시 확인. 원하는 목소리와 리듬으로 생성되었는지, 가사·발음·유사성은 청취 미검수다. 앱 연결·배포는 하지 않았다.

## 2026-10-30 더 어린 유아 목소리 시안

- 사용자는 이전보다 한 살가량 더 어린 목소리와 좀 더 튀는 느낌을 요청했다. 프롬프트에서 더 어린 유아 합성 목소리와 더욱 경쾌한 리듬을 지정했다. 음성의 정확한 나이는 제어하거나 검증할 수 없다.
- 파일: `artifacts/beginner-chants/little-bird-toddler-v1.wav` (8,064,044바이트, SHA-256 `eefcbdf3ff254d689757e72f69be9c3098e20eaade46fc549a8b97d86995fd03`). 원본과 생성 보고서는 `artifacts/beginner-chants/local-toddler-v1/`에 보존한다.
- 실제 프롬프트: `English learning chant, 80 bpm, very young toddler-like voices, a little younger than preschool voices, bright and adorable small children chorus, playful energetic call and response, extra bouncy, lively cheerful rhythmic melody, clear English pronunciation at an easy pace, prominent vocals, lively claps, ukulele, gentle xylophone and light percussion, warm natural sound without cartoon squeaks. Only the supplied lyrics. No imitation of real people or existing songs.` 가사와 모델·설정·시드는 앞선 시안과 같다. 참조 음원은 사용하지 않았다.
- 기술 검사: WAV 디코딩, 48kHz·스테레오·42.0초, 최대 진폭 0.89127, RMS 0.13105, 해시 확인. 목소리와 리듬의 적합성·가사·발음·유사성은 청취 미검수다. 앱 연결·배포는 하지 않았다.

## 2026-10-30 크리스마스 분위기 시안

- 직전 유아 시안에 크리스마스 캐럴 느낌을 더하라는 요청으로, 먼저 새 곡을 생성한 뒤 직전 시안의 구조를 더 살리기 위해 해당 WAV를 입력하는 커버 생성도 실행했다. 보컬과 멜로디 보존은 보장되지 않으며 청취 확인이 필요하다.
- 커버: `artifacts/beginner-chants/little-bird-carol-cover-v1.wav`, SHA-256 `6ad2a1023a26f343e8e4611a784d3f2f42127d40f447f6ec4e522f9ee5c2992b`, 원본 참조 강도 0.8. 참조 파일은 위 유아 시안이다.
- 별도 새 곡: `artifacts/beginner-chants/little-bird-carol-v1.wav`, SHA-256 `5be18c44d85e6c2a5794c97274e394c2736e9e45bafb60e7054316d07cfe6a02`, 참조 음원 없음. 두 생성 보고서는 `artifacts/beginner-chants/local-carol-cover-v1/`, `artifacts/beginner-chants/local-carol-v1/`에 있다.
- 실제 프롬프트: `English learning chant, 80 bpm, very young toddler-like voices, a little younger than preschool voices, bright and adorable small children chorus, playful energetic call and response, extra bouncy, lively cheerful rhythmic melody, clear English pronunciation at an easy pace, prominent vocals, lively claps, ukulele, gentle xylophone and light percussion. Warm festive Christmas carol atmosphere, delicate sleigh bells, sparkling glockenspiel and cozy winter feeling. Natural sound without cartoon squeaks. Only the supplied lyrics. Original melody; do not imitate or quote any existing Christmas song or real voice.` 두 시안 모두 기존 가사와 모델·시드를 사용했다.
- 기술 검사: 두 WAV 모두 48kHz·스테레오·42.0초이며 정상 디코딩과 비무음을 확인했다. 커버의 피크 0.89124, RMS 0.17166; 새 곡의 피크 0.89124, RMS 0.15163. 캐럴 분위기·원곡 유지·가사·발음·기존 곡 유사성은 청취 미검수이며 앱 연결·배포는 하지 않았다.
