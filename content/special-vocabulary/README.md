# 특급 학술·심화 어휘 후보

이 디렉터리는 운영 단어장과 분리된 검수 자료다. WordNet 존재 확인이나 LLM 검토는 토플 출제 빈도·공식 난이도 인증을 뜻하지 않는다.

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

002~005 묶음은 각 `review-002/README.md`~`review-005/README.md`를 따른다. 후보 누적 250개이며 최신 로컬 검수용 제외 목록은 `artifacts/vocabulary-review-005/vocabulary-exclusions-for-next-batch.csv`의 3,589개다. 사용자는 같은 ChatGPT 웹 대화의 기존 프롬프트로 계속 수집하므로 005부터 새로운 수집 프롬프트·첨부 ZIP을 만들지 않는다. 후속 묶음 검사에는 다음 명령을 사용한다. provenance가 없는 입력은 자체 원자료 확인 기록과 구분해 처리한다.

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

특급 지원을 구현할 때 기존 CSV 행 순서·ID를 유지하고 타입·변환기·출제 규칙·세 앱 난이도 UI와 검사 범위를 함께 변경한다. WordNet 전문 고지를 저장소뿐 아니라 배포 대상 앱의 열람 가능한 고지에도 포함시키고 패키지에 보존되었는지 확인한다. 현재 앱에는 후보를 반영하지 않았으므로 이 앱 내 고지 연결도 미실행이다.

이 대화의 사용자 지시에 따라 토스 `.ait`·Android APK 생성 및 Capacitor 동기화는 별도 요청 전 실행하지 않는다.
