import fs from 'fs';
import path from 'path';

const CSV_HEADER = [
  '난이도',
  '영단어',
  '뜻',
  '품사',
  '동의어',
  '예문',
  '예문해석'
];

const LEVEL_MAP = {
  '초급': 'beginner',
  '중급': 'intermediate',
  '고급': 'advanced'
};

// WordItem 타입 정의 (런타임에서 사용 가능하도록)
const WordItemSchema = {
  id: String,
  level: String,
  word: String,
  meaning: String,
  partOfSpeech: String,
  example: String,
  exampleMeaning: String,
  synonym: [String, undefined],
  isBookmarked: Boolean,
  isQuizUsed: Boolean
};

function parseLine(line) {
  // 탭 또는 쉼표 구분자 자동 감지
  const tabs = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  
  if (tabs > commas) {
    return line.split('\t');
  } else if (commas > tabs) {
    // 쉼표가 있지만 공백이 있는 경우 처리
    return line.split(',').map(s => s.trim());
  } else {
    // 탭과 쉼표가 모두 없는 경우 (공백 구분)
    return line.split(/\s+/);
  }
}

function convertCSVToJSON(csvContent) {
  const lines = csvContent.trim().split('\n');
  const words = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseLine(line);
    
    if (fields.length < CSV_HEADER.length) {
      console.warn(`경고: ${i + 1} 번째 줄의 헤더가 부족합니다.`);
      continue;
    }

    const level = LEVEL_MAP[fields[0].trim()] || 'beginner';
    const word = fields[1].trim().toUpperCase();
    
    if (word.length < 3) {
      console.warn(`경고: ${i + 1} 번째 줄의 단어 "${word}"는 3 글자 미만입니다. 제외됩니다.`);
      continue;
    }

    words.push({
      id: `word-${i}`,
      level,
      word,
      meaning: fields[2].trim(),
      partOfSpeech: fields[3].trim(),
      example: fields[5]?.trim() || '',
      exampleMeaning: fields[6]?.trim() || '',
      synonym: fields[4]?.trim() || undefined,
      isBookmarked: false,
      isQuizUsed: false,
    });
  }

  return words;
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('사용법: node scripts/convert-vocab.mjs <csv 파일 경로>');
  process.exit(1);
}

const outputPath = path.join(__dirname, '..', 'core', 'src', 'assets', 'vocab.json');

try {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const words = convertCSVToJSON(csvContent);
  
  fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`변환 완료: ${words.length} 개의 단어가 vocab.json 에 저장되었습니다.`);
} catch (error) {
  console.error('CSV 변환 중 오류:', error);
  process.exit(1);
}
