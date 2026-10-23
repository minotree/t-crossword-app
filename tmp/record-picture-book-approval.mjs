import fs from 'node:fs';
import { createHash } from 'node:crypto';
const hash = v => createHash('sha256').update(v).digest('hex');
const report = {
  reviewedDate: '2026-10-19',
  reviewedBy: 'Codex: editorial, visual and production-record review; not a legal opinion or device test',
  evidence: 'content/picture-book-final-review-2026-10-19.md',
  scope: 'Current English/Korean texts, all 119 selected cards, image generation records and project-local references. OpenAI output terms checked; no external font files or dictionary definitions included in the reading content.',
  limitations: 'No guarantee of exclusivity or non-infringement; no exhaustive external corpus comparison. Actual Toss device readability and publisher identity remain release checks.',
  books: [],
};
for (const [directory, file] of [['beginner-poems','poems.json'],['intermediate-readings','books.json'],['advanced-readings','books.json']]) {
  const base = `content/${directory}`, path = `${base}/${file}`;
  const books = JSON.parse(fs.readFileSync(path,'utf8'));
  for (const b of books) {
    b.reviewStatus = 'approved';
    report.books.push({id:b.id, contentSha256:hash(JSON.stringify(b)),
      imageSha256:(b.pages||[b]).map(p=>hash(fs.readFileSync(`${base}/${p.image}`))),
      checks:['text-translation','image-text-title-page','character-scene','generation-records-and-references'],
    });
  }
  fs.writeFileSync(path, JSON.stringify(books,null,2)+'\n');
}
fs.writeFileSync('content/picture-book-approval.json',JSON.stringify(report,null,2)+'\n');
console.log(`${report.books.length} reviewed books recorded.`);
