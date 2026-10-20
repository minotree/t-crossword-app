// Inflections only: related words such as teacher/teach are deliberately excluded.
const irregularForms: Readonly<Record<string, string>> = {
  be: 'am is are was were been being', have: 'has had', do: 'does did done',
  go: 'goes went gone', get: 'got gotten', make: 'made', take: 'took taken',
  come: 'came', become: 'became', run: 'ran', eat: 'ate eaten', drink: 'drank drunk',
  see: 'saw seen', say: 'said', tell: 'told', think: 'thought', buy: 'bought',
  bring: 'brought', catch: 'caught', teach: 'taught', fight: 'fought', seek: 'sought',
  sell: 'sold', pay: 'paid', lay: 'laid', lie: 'lay lain lying', die: 'dying', tie: 'tying',
  find: 'found', feel: 'felt', keep: 'kept', leave: 'left', lose: 'lost', meet: 'met',
  sleep: 'slept', sweep: 'swept', weep: 'wept', hear: 'heard', hold: 'held',
  stand: 'stood', understand: 'understood', sit: 'sat', win: 'won', dig: 'dug',
  swim: 'swam swum', sing: 'sang sung', ring: 'rang rung', sink: 'sank sunk',
  begin: 'began begun', spring: 'sprang sprung', cling: 'clung', swing: 'swung',
  write: 'wrote written', ride: 'rode ridden', drive: 'drove driven', rise: 'rose risen',
  give: 'gave given', forgive: 'forgave forgiven', fall: 'fell fallen',
  break: 'broke broken', speak: 'spoke spoken', wake: 'woke woken', choose: 'chose chosen',
  steal: 'stole stolen', freeze: 'froze frozen', wear: 'wore worn', tear: 'tore torn',
  bear: 'bore born borne', swear: 'swore sworn', fly: 'flew flown', grow: 'grew grown',
  know: 'knew known', throw: 'threw thrown', blow: 'blew blown', draw: 'drew drawn',
  withdraw: 'withdrew withdrawn', show: 'showed shown', shake: 'shook shaken',
  bite: 'bit bitten', hide: 'hid hidden', forget: 'forgot forgotten',
  build: 'built', send: 'sent', spend: 'spent', lend: 'lent', bend: 'bent',
  feed: 'fed', lead: 'led', bleed: 'bled', shoot: 'shot', light: 'lit',
  creep: 'crept', deal: 'dealt', mean: 'meant', learn: 'learnt', dream: 'dreamt',
  burn: 'burnt', smell: 'smelt', spell: 'spelt', leap: 'leapt', kneel: 'knelt',
  child: 'children', person: 'people', man: 'men', woman: 'women', tooth: 'teeth',
  foot: 'feet', mouse: 'mice', goose: 'geese', ox: 'oxen',
  good: 'better best', well: 'better best', bad: 'worse worst', far: 'farther farthest further furthest',
  little: 'less least', many: 'more most', much: 'more most',
  knife: 'knives', wife: 'wives', life: 'lives', leaf: 'leaves', wolf: 'wolves',
  shelf: 'shelves', self: 'selves', half: 'halves', calf: 'calves', loaf: 'loaves',
  thief: 'thieves', analysis: 'analyses', crisis: 'crises', phenomenon: 'phenomena',
  criterion: 'criteria', datum: 'data',
};

const comparableWords = new Set(('big small tall short long wide narrow high low deep shallow ' +
  'fast slow quick old young new rich poor cheap clean dark bright light hard soft cold warm hot ' +
  'cool strong weak thick thin fat slim sad happy easy busy heavy pretty ugly funny friendly ' +
  'early late large nice safe brave fine close great smart clever quiet simple gentle').split(' '));

const uninflectedWords = new Set(('i you he she it we they me him her us them my your his its our their ' +
  'a an the this that these those who whom whose what which where when why how ' +
  'and or but if as than then so at by for from in into of on onto to with without ' +
  'not no yes very too also only all any each every some both either neither').split(' '));

function inflections(word: string): string[] {
  if (uninflectedWords.has(word)) return [word];
  const forms = new Set([word, ...(irregularForms[word]?.split(' ') ?? [])]);
  // The multiword spelling of alright is a single alternative.
  if (word === 'alright') forms.add('all right');
  forms.add(`${word}s`);
  forms.add(`${word}es`);
  forms.add(`${word}ed`);
  forms.add(`${word}ing`);
  const endings = ['ing'];
  if (comparableWords.has(word)) {
    forms.add(`${word}er`);
    forms.add(`${word}est`);
    endings.push('er', 'est');
  }
  if (word.endsWith('e')) {
    forms.add(`${word}d`);
    for (const ending of endings) forms.add(word.slice(0, -1) + ending);
  }
  if (/[^aeiou]y$/.test(word)) {
    for (const ending of ['ies', 'ied', ...(comparableWords.has(word) ? ['ier', 'iest'] : [])]) forms.add(word.slice(0, -1) + ending);
  }
  if (/[aeiou][bcdfgklmnprst]$/.test(word)) {
    for (const ending of ['ed', ...endings]) forms.add(word + word.slice(-1) + ending);
  }
  return [...forms];
}

/** Mask whole tokens and their inflections, keeping the blank at the answer length. */
export function maskWordInExample(example: string, answer: string): string {
  const word = answer.trim();
  if (!word) return example;
  const alternatives = word.toLowerCase().split('/').flatMap(inflections)
    .sort((a, b) => b.length - a.length)
    .map((form) => form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return example.replace(new RegExp(`\\b(?:${alternatives.join('|')})\\b`, 'gi'), '_'.repeat(word.length));
}
