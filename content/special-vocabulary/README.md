# 특급 학술·심화 어휘 후보

이 디렉터리는 원본·검수 기록을 보존한다. 2026-10-26 사용자 승인에 따라 001~010의 보정본 500개를 앱 소스 단어장에 반영했다(아직 출시하지 않음). WordNet 존재 확인이나 LLM 검토는 토플 출제 빈도·공식 난이도 인증을 뜻하지 않는다.

## 1차 50개

`review-001/`에 사용자 원본 3개, 보정본, 수정 이력, 단어별 WordNet 의미 선택, 원자료 고지와 LLM 실행 기록을 보존한다. 최초 생성 모델 표기는 사용자가 알려 준 `gpt 6.1 sol light`이며 내부 모델 ID는 독립 확인하지 않았다.

- `editorial-decisions.json`: 실제 채택한 의미·수정과 이유
- `wordnet-evidence.json`: WordNet 3.0에서 해당 표제어가 포함된 synset 목록. **WordNet 파생 데이터이므로 `WORDNET-LICENSE.txt`와 함께 보존·배포한다.**
- `selected-synsets.json`: 후보의 품사·한국어 의미에 대응하도록 에이전트가 선택한 synset ID
- `vocabulary-special-candidates-001-reviewed.csv`: 별도 보정본. 운영 CSV에 미병합
- `vocabulary-special-sources-001-reviewed.csv`: 실제 대조 결과를 반영한 출처 기록
- `vocabulary-special-changes-001.csv`: 원본 대비 변경 필드와 이유
- `*-request.json`, `*-response.json`: 로컬 LLM의 실제 프롬프트·설정·원응답. 모델의 주장은 검증된 사실이나 실행 지시로 취급하지 않는다.
- `validation.json`: 형식·중복·WordNet ID/품사·파일 왕복 검사 결과
- `next-batch-prompt.txt`: 추가 450개를 50개씩 요청하는 후속 프롬프트
- `usage-conditions.md`: 확인한 공식 이용 조건과 배포 전 이행 항목

Excel용 `.xlsx`, BOM CSV, 다음 묶음 제외 목록은 `artifacts/vocabulary-review-001/`에 생성한다. 원본 파일은 수정하지 않는다.

## 재현

002~010 묶음은 각 `review-002/README.md`~`review-010/README.md`를 따른다. 후보 누적 500개로 수집 목표를 달성했으며 최신 로컬 검수용 제외 목록은 `artifacts/vocabulary-review-010/vocabulary-exclusions-for-next-batch.csv`의 3,839개다. 사용자는 같은 ChatGPT 웹 대화의 기존 프롬프트로 계속 수집하므로 005부터 새로운 수집 프롬프트·첨부 ZIP을 만들지 않았다. 후속 묶음 검사에는 다음 명령을 사용한다. provenance가 없는 입력은 자체 원자료 확인 기록과 구분해 처리한다.

```powershell
python scripts/review-special-vocabulary-batch.py --batch 002 --input-dir D:/Download
```

저장소 루트에서 Python 표준 라이브러리만 사용한다.

```powershell
# 공식 WordNet 원본을 artifacts/vocabulary-review-001/WordNet-3.0.tar.gz에 준비한 뒤 실행
python scripts/review-special-vocabulary.py

# Ollama에 설치된 로컬 모델로 보조 검수. 모델을 내려받거나 앱 번들을 만들지 않는다.
python scripts/review-special-vocabulary.py --model qwen3:14b --output qwen3-review
python scripts/review-special-vocabulary.py --model gpt-oss:20b --output gpt-oss-review-retry

# 기록된 편집 결정을 적용한 별도 CSV/XLSX와 제외 목록 생성 및 실제 내용 검증
python scripts/finalize-special-vocabulary-review.py
```

로컬 모델 실행은 시간·메모리를 사용한다. 재실행 시 같은 `--output` 접두사의 실행 기록을 덮어쓰므로 새로운 검수에는 다른 접두사를 사용한다. 다운로드 원본의 URL·SHA-256은 `wordnet-download.json`에 기록한다.

## 병합 전후 경계

편집검수 상태와 출시 상태를 구분한다. 현재 사람의 최종 편집 검수·외부 문구 유사성 전수검색·토플 빈도 검증은 미실행이다. 이 중 어떤 검토를 했고 하지 않았는지 기록하며 비침해를 보장하지 않는다.

특급 500개는 기존 CSV 뒤에 추가했으며 앞선 3,339개 항목의 내용과 ID를 그대로 보존했다. 원본·보정 CSV는 이 디렉터리에 별도로 유지한다. 공통 타입·변환기·출제 순위와 세 앱의 퀴즈 선택·단어장·설정을 함께 반영했다. 누적 출제 규칙은 유지하고 특급의 학습완료 집계는 500개만 대상으로 한다. 그림책은 기존 3단계를 유지한다.

WordNet 전문은 `packages/core/src/assets/wordnetLicense.ts`의 순수 문자열로 보존하고 세 앱 설정에서 열람할 수 있다. 일반 웹 빌드의 고지 포함 검사까지 수행했으며 `.ait`·APK 내부 확인과 실제 기기 확인은 아직 하지 않았다. 공식 이용 조건은 2026-10-26 병합 시점에 다시 조회했다. 과거 묶음 README의 ‘운영 미병합’은 각 묶음 검수 당시의 기록이다.

```powershell
node scripts/convert-vocab.mjs words_completed.csv
python scripts/check-special-vocabulary-integration.py --builds
```

두 번째 명령은 세 앱 일반 빌드를 먼저 실행한 뒤 사용한다. 검수본 500개와 CSV/JSON 대응·기존 ID·중복·수준별 개수·고지 문자열 및 빌드 내 고지 표지를 검사하고 `artifacts/special-vocabulary-integration.json`에 결과를 저장한다. 전체 영어·한국어의 사람 최종 검수나 인터넷 전체 문구 검색을 대신하지 않는다.

이 대화의 사용자 지시에 따라 토스 `.ait`·Android APK 생성 및 Capacitor 동기화는 별도 요청 전 실행하지 않는다.
