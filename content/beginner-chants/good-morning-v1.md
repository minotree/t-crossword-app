# Good Morning — 캐럴 분위기 챈트 시안

- 제작일: 2026-10-30. 상태: `draft-unreviewed`, 청취·편집·권리 검수 미완료.
- 그림책 원본: `../beginner-poems/poems.json`의 `beginner-02`. 원문 4행을 각각 두 번 반복한 뒤 4행을 다시 한 번 부르는 가사를 모델에 입력했다. 아래 줄은 원문 그대로다.

```text
Good morning, sun.
Good morning, tree.
Hello, little flower.
Come and play with the bee.
```

- 제작 방식: [Little Bird 시안](little-bird-v1.md)의 어린 합성 목소리와 밝은 캐럴 분위기를 요청해 로컬에서 새로 생성했다. 기존 곡을 음원으로 참조하지 않아 같은 목소리·멜로디를 보장하지 않는다. 실제 아동 음성은 사용하지 않았다.
- 도구·모델: ACE-Step `acestep-v15-turbo`, 모델 리비전 `19671f406d603126926c1b7e2adc169acbcade22`, 코드 리비전 `ca1e85fe9430179831e6bc6be790c332190a3866`. MIT 라이선스·권리 검토 관련 기록은 Little Bird 문서를 따른다. 로컬 GPU, float32, 80 BPM·42초 요청, 시드 20261030, 8회 추론. 언어 모델은 사용하지 않았다. 유료 API 호출·결제 없음.
- 입력 프롬프트: `English learning chant, 80 bpm, very young toddler-like voices, a little younger than preschool voices, bright and adorable small children chorus, playful energetic call and response, extra bouncy, lively cheerful rhythmic melody, clear English pronunciation at an easy pace, prominent vocals, lively claps, ukulele, gentle xylophone and light percussion. Warm festive Christmas carol atmosphere, delicate sleigh bells, sparkling glockenspiel and cozy winter feeling. Natural sound without cartoon squeaks. Only the supplied lyrics. Original melody; do not imitate or quote any existing Christmas song or real voice.`
- 음원: `artifacts/beginner-chants/good-morning-carol.wav`, 8,064,044바이트, SHA-256 `8a712d3c23ac505b55b2274e55fa00feec7b80d03df893ff8b49584fdf0923f5`. 원본과 입력·결과 보고서는 `artifacts/beginner-chants/good-morning-carol-v1/`에 보존한다.
- 기술 확인: 원본 가사와 생성 입력 12행 일치, WAV 디코딩, 48kHz 스테레오·42초, 피크 0.89124, RMS 0.15346, 해시 확인. 실제 음원의 가사 순서·누락·발음·목소리·캐럴 분위기·기존 곡 유사성은 청취 미검수다. 앱 연결·배포하지 않았다.

## 빠른 템포 시안 · 2026-10-30

- 사용자의 조금 빠른 템포 요청으로 같은 모델과 가사에 96 BPM·36초를 지정해 새로 생성했다. 기존 곡의 속도를 변환한 것이 아니므로 멜로디와 목소리는 달라질 수 있다. 참조 음원은 사용하지 않았다.
- 프롬프트는 위 기록의 `80 bpm`을 `96 bpm`으로 바꾸고 `A slightly faster, lively tempo while keeping the words easy to follow.`를 추가했다. 나머지 입력과 모델·시드는 위 기록과 같다.
- 음원: `artifacts/beginner-chants/good-morning-carol-fast.wav`, 6,912,044바이트, SHA-256 `03233b586a5feaf28da919feec3fbe94f4e87d3bec95b4c924d2610d6c6fd6f4`. 생성 보고서·원본은 `artifacts/beginner-chants/good-morning-carol-fast-v1/`에 있다.
- 기술 확인: 원본 가사와 입력 12행 일치, WAV 디코딩, 48kHz 스테레오·36초, 피크 0.89127, RMS 0.13631, 해시 확인. 실제 템포·가사·발음·목소리·유사성은 청취 미검수, 앱 연결·배포 미실행.
