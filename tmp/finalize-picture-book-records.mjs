import fs from 'node:fs';
const base = 'content/beginner-poems';
const recordsPath = `${base}/generation-record.json`;
const originalPath = `${base}/generation-record-20261016.json`;
if (!fs.existsSync(originalPath)) fs.copyFileSync(recordsPath, originalPath);
const original = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
const poems = JSON.parse(fs.readFileSync(`${base}/poems.json`, 'utf8'));
const records = poems.map(p => {
  if (!p.image.includes('-v')) return original.find(r=>r.id===p.id);
  const stem = p.image.split('/').pop().replace('.png', '');
  const record = JSON.parse(fs.readFileSync(`${base}/generation-records/${stem}.json`, 'utf8'));
  return {...record, id:p.id};
});
fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2)+'\n');
console.log(`Updated ${records.length} active records; original record retained.`);
