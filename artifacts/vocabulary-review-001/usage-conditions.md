# 이용 조건 확인 기록

확인일: 2026-10-26. 아래는 실제 확인 범위의 기록이며 비침해·독점권 보장이 아니다.

| 대상 | 확인한 공식 자료 | 확인 내용과 이행 범위 |
| --- | --- | --- |
| WordNet 3.0 | [공식 이용 조건](https://wordnet.princeton.edu/license-and-commercial-use), [라이선스 문서](https://wordnet.princeton.edu/documentation/wnlicens7wn), 공식 배포 압축 파일의 LICENSE | 목적에 관계없이 사용·복사·수정·배포를 무상 허용하되 저작권 고지·조건·면책 문구를 파생물 포함 모든 사본에 유지한다. 배포 홍보에 Princeton 명칭을 사용하는 제한을 준수한다. 원문은 `WORDNET-LICENSE.txt`에 보존했다. 후보를 앱에 병합하는 시점에 배포물에도 고지 전문을 포함해야 한다. 출처 표시는 후원·공식 인증 표시와 구분한다. |
| 최초 ChatGPT 웹 생성물 | [OpenAI 개인용 이용약관](https://openai.com/policies/row-terms-of-use/)의 Content 및 Using our Services 조항 | 법이 허용하는 범위에서 사용자와 OpenAI 사이의 출력 권리를 사용자에게 부여하지만 출력의 유일성·정확성·제3자 권리 비침해는 보장하지 않는다. 입력·제3자 자료의 권리는 별도이며 출력 평가와 AI 생성 경위의 정직한 기록이 필요하다. 사용자 보고 모델명은 `gpt 6.1 sol light`; 내부 모델 ID나 당시 계정·계약 종류는 독립 확인하지 않았다. 조직용 계정이면 해당 계약도 별도 확인해야 한다. |
| 로컬 Qwen3-14B | [Qwen 공식 모델 카드](https://huggingface.co/Qwen/Qwen3-14B), [LICENSE](https://huggingface.co/Qwen/Qwen3-14B/blob/main/LICENSE), Ollama `/api/show`의 설치 모델 라이선스 | Apache-2.0 표기를 확인하고 설치본의 전문을 `QWEN3-LOCAL-LICENSE.txt`로 보관했다. 이번에는 모델 가중치를 앱에 배포하지 않고 로컬 보조 검수에만 사용한다. 모델 라이선스를 생성 콘텐츠의 독점권·비침해 보장으로 해석하지 않는다. |
| 로컬 GPT OSS 20B | [공식 LICENSE](https://github.com/openai/gpt-oss/blob/main/LICENSE), [공식 사용 정책](https://huggingface.co/openai/gpt-oss-20b/raw/main/USAGE_POLICY), Ollama `/api/show`의 설치본 | Apache-2.0 전문을 `GPT-OSS-LOCAL-LICENSE.txt`로 보관했다. 공식 사용 정책은 적용 법규 준수를 요구한다. 이번에는 가중치 배포·학습 없이 보조 검수에 사용한다. 모델 의견은 출처·권리 검증을 대신하지 않는다. |

## 원자료 확인

- 다운로드: `https://wordnetcode.princeton.edu/3.0/WordNet-3.0.tar.gz`
- SHA-256: `640db279c949a88f61f851dd54ebbb22d003f8b90b85267042ef85a3781d3a52`
- 원자료에서 50개 표제어 모두 확인. 선택 의미·품사 대응은 `selected-synsets.json`으로 재현한다.
- WordNet gloss와 예문은 검수 근거 파일에만 보관한다. 앱용 한국어 설명·영어 예문·해석은 AI 초안과 이번 에이전트 편집본이며 사전 문장 전재를 의도하지 않았다. 원래 생성 과정의 모든 외부 참조를 추적할 수는 없다.

## 아직 하지 않은 것

- 외부 사전·교재·인터넷 전체를 대상으로 한 문구 유사성 전수검색
- 사람이 수행하는 최종 영어·한국어 편집 검수
- 토플 기출 빈도·ETS 공식 어휘 목록 여부 확인
- 운영 단어장 병합과 각 배포 앱의 WordNet 고지 UI 연결·번들 포함 검사

따라서 현재 상태는 ‘에이전트 편집검수 완료·출시대기’다. WordNet의 이용 허용과 개별 AI 문장의 품질·권리 판단은 서로 다른 확인 항목이다.
