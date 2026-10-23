import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const changes = {
  1: [
    'Little bird, sing with me.\nLittle tree under the sky.\nLittle bee, fly with me.\nCome and play under the sky.',
    '작은 새야, 나와 함께 노래하자.\n하늘 아래 작은 나무가 있어요.\n작은 벌아, 나와 함께 날자.\n이리 와서 하늘 아래 함께 놀자.'
  ],
  3: [
    'Rain around the house.\nRain along the street.\nListen to the happy music.\nCome and dance with me.',
    '집 둘레에 비가 내려요.\n거리를 따라 비가 내려요.\n즐거운 음악에 귀 기울여 봐요.\n이리 와서 나와 함께 춤을 춰요.'
  ],
  21: ['Thank the family with the heart.', 'Thank my family for their care.', '가족에게 마음을 담아 고마워해요.', '가족의 보살핌에 감사해요.'],
  22: ['Sandwich, salad, hamburger, stop!', 'Sandwich, salad, hamburger, too.', '샌드위치, 샐러드, 햄버거 앞에서 멈춰요!', '샌드위치와 샐러드, 햄버거도 있어요.'],
  25: ['Shirt and pants, one sock, one shoe.', 'Shirt and pants, warm socks and shoes.', '셔츠와 바지, 양말 한 짝, 신발 한 짝.', '셔츠와 바지, 따뜻한 양말과 신발.'],
  26: ['Pretty color, bright, not old.', 'Pretty color, bright and bold.', '빛나고 새로운 예쁜 빛깔.', '밝고 선명한 예쁜 빛깔.'],
  28: [
    'Bath time, brush your teeth.\nWash your hands and clean the room.\nWet hair beside the wall.\nDry the floor before a fall.\nHang the curtain, open the window.\nSoft light, one good habit.',
    '목욕 시간, 이를 닦아요.\n손을 씻고 방을 청소해요.\n벽 옆에서 머리카락이 젖어 있어요.\n넘어지지 않도록 바닥의 물기를 닦아요.\n커튼을 달고 창문을 열어요.\n부드러운 빛, 좋은 습관 하나.'
  ],
  31: ['Collect the toy and put the box back.', 'Collect the toys and put the box back.', '장난감을 모으고 상자를 제자리에 두어요.', '장난감을 모으고 상자를 제자리에 두어요.'],
  36: ['Touch the key and turn the radio.', 'Touch the key and turn on the radio.', '버튼을 누르고 라디오를 조작해요.', '버튼을 누르고 라디오를 켜요.'],
  37: ['Drive the road and turn right.', 'Drive along the road and turn right.', '길을 달리다가 오른쪽으로 돌아요.', '길을 따라 달리다가 오른쪽으로 돌아요.'],
  38: ['Map the earth and take one trip.', 'See the map and take one trip.', '지도를 보며 지구를 여행해요.', '지도를 보고 여행을 떠나요.'],
  42: ['Win with care, smile face beside face.', 'Win with care, a smile on every face.', '서로 배려하며 이기고 나란히 웃어요.', '서로 배려하며 이기니 모두의 얼굴에 미소가 피어요.'],
  44: ['Future, history, the time can feel near.', 'Future and history, far and near.', '미래와 지난날이 가까이 느껴져요.', '멀기도 가깝기도 한 미래와 지난날.'],
  45: ['Six, seven, eight, feel the drive.', 'Six, seven, eight, count and smile.', '여섯, 일곱, 여덟, 신나게 나아가요.', '여섯, 일곱, 여덟, 숫자를 세며 웃어요.'],
};
const poemsPath = 'content/beginner-poems/poems.json';
const poems = read(poemsPath);
const jobs = [];
for (const [num, change] of Object.entries(changes)) {
  const p = poems[Number(num)-1];
  const originalImage = p.image;
  if (change.length === 2) [p.poem, p.translation] = change;
  else { p.poem = p.poem.replace(change[0], change[1]); p.translation = p.translation.replace(change[2], change[3]); }
  p.words = [...new Set((p.title+' '+p.poem).toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g))].sort();
  const target = `images/${p.id}-v2.png`;
  jobs.push({ id:p.id, base:'content/beginner-poems', originalImage, target, title:p.title, text:p.poem });
  p.image = target;
}
write(poemsPath, poems);
const advancedPath = 'content/advanced-readings/books.json';
const books = read(advancedPath);
books.find(b=>b.id==='advanced-poem-01').koreanTitle = '보내지 않은 편지';
const court = books.find(b=>b.id==='advanced-courtroom-01');
court.pages[9].translation = court.pages[9].translation.replace('펜는', '펜은').replace('펜가', '펜이');
const mystery = books.find(b=>b.id==='advanced-mystery-01');
mystery.pages[1].translation = mystery.pages[1].translation.replace('보증금은', '맡긴 돈은').replace('아래 서랍', '아래쪽 상자');
mystery.pages[4].translation = mystery.pages[4].translation.replace('그 돈에 비밀스러운 관계가 숨겨져 있었을까?', '맡긴 돈에 비밀스러운 관계가 숨겨져 있었을까?');
mystery.pages[5].text = mystery.pages[5].text.replace('The distinct deposit was payment he owed her,', 'The money recorded as a deposit was payment he owed her,');
mystery.pages[5].translation = mystery.pages[5].translation.replace('그 특별한 금액은 아버지가 지급해야 할 보수였다.', '맡긴 돈으로 기록된 그 금액은 아버지가 지급해야 할 보수였다.');
const sf = books.find(b=>b.id==='advanced-sf-01');
sf.pages[7].text = sf.pages[7].text.replace('He made no claim that suffering entitled him to a renewed relationship.', 'He did not claim a right to a renewed relationship merely because he had suffered.');
for (const [book, num] of [[mystery,6],[sf,8]]) {
  const page = book.pages[num-1], originalImage = page.image;
  page.image = `images/${book.id}-${String(num).padStart(2,'0')}-v2.png`;
  jobs.push({ id:`${book.id}-${String(num).padStart(2,'0')}`, bookId:book.id, page:num, total:book.pages.length, base:'content/advanced-readings', originalImage, target:page.image, title:book.title, heading:page.title, text:page.text });
}
write(advancedPath, books);
for(const j of jobs) j.prompt = `Use case: text-localization. Edit target: the attached existing English reading card. Preserve the illustration, people, scene, colors, paper, composition and title. Replace ONLY the reading-panel body with the exact corrected English text below. Keep a readable dark serif font, full words, comfortable margins, and every line fully inside the card. Preserve title exactly: "${j.title}".${j.heading?` Preserve heading "${j.heading}" and page indicator "${j.page} / ${j.total}".`:''} No Korean, logos, watermarks or added captions. Preserve poem line breaks.\nCorrected body (verbatim):\n${j.text}`;
write('tmp/picture-book-edit-jobs.json', jobs);
console.log(`Prepared ${jobs.length} image edits.`);
