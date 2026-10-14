import fs from 'node:fs';
import path from 'node:path';

const CSV_HEADER = [
  '난이도',
  '영단어',
  '뜻',
  '품사',
  '동의어',
  '예문',
  '예문해석',
];

const LEVEL_MAP = {
  초급: 'beginner',
  중급: 'intermediate',
  고급: 'advanced',
};

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) {
        throw new Error(`CSV ${rows.length + 1}번째 레코드에 잘못된 따옴표가 있습니다.`);
      }
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error('CSV에 닫히지 않은 따옴표가 있습니다.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function convertCsvToWords(csvContent) {
  const rows = parseCsv(csvContent.replace(/^\uFEFF/, ''));
  const [header, ...records] = rows;

  if (!header || header.length !== CSV_HEADER.length ||
      header.some((value, index) => value.trim() !== CSV_HEADER[index])) {
    throw new Error(`CSV 헤더가 예상 형식과 다릅니다. 필요한 헤더: ${CSV_HEADER.join(',')}`);
  }

  const words = [];

  records.forEach((record, index) => {
    const recordNumber = index + 2;
    if (record.length !== CSV_HEADER.length) {
      throw new Error(`${recordNumber}번째 레코드의 열이 ${CSV_HEADER.length}개가 아닙니다 (${record.length}개).`);
    }

    const [rawLevel, rawWord, rawMeaning, rawPartOfSpeech, rawSynonym, rawExample, rawExampleMeaning] = record;
    const level = LEVEL_MAP[rawLevel.trim()];
    const word = rawWord.trim().toUpperCase();

    if (!level) throw new Error(`${recordNumber}번째 레코드의 난이도를 확인하세요: ${rawLevel}`);
    if (word.length < 3) {
      console.warn(`경고: ${recordNumber}번째 레코드의 단어 "${word}"는 3글자 미만이라 제외합니다.`);
      return;
    }
    if (!rawMeaning.trim()) throw new Error(`${recordNumber}번째 레코드에 뜻이 없습니다.`);

    words.push({
      id: `word-${recordNumber}`,
      level,
      word,
      meaning: rawMeaning.trim(),
      partOfSpeech: rawPartOfSpeech.trim(),
      example: rawExample.trim(),
      exampleMeaning: rawExampleMeaning.trim(),
      synonym: rawSynonym.trim() || undefined,
      isBookmarked: false,
      isQuizUsed: false,
    });
  });

  return words;
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('사용법: node scripts/convert-vocab.mjs <csv 파일 경로>');
  process.exit(1);
}

const outputPath = path.resolve('packages/core/src/assets/vocab.json');

try {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const words = convertCsvToWords(csvContent);
  fs.writeFileSync(outputPath, `${JSON.stringify(words, null, 2)}\n`, 'utf8');
  console.log(`변환 완료: ${words.length}개 단어를 ${outputPath}에 저장했습니다.`);
} catch (error) {
  console.error('CSV 변환 중 오류:', error.message);
  process.exit(1);
}
