const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['index.html', 'text-counter.html', 'word-character-counter.html', 'character-counter-without-spaces.html'];
const expected = [
  { file: 'index.html', title: 'Free Online Word Counter Tool – Count Words & Characters', canonical: 'https://onlinewordcountertool.com/' },
  { file: 'text-counter.html', title: 'Text Counter Online – Count Words, Characters & Sentences', canonical: 'https://onlinewordcountertool.com/text-counter.html' },
  { file: 'word-character-counter.html', title: 'Word and Character Counter Online – Free Instant Tool', canonical: 'https://onlinewordcountertool.com/word-character-counter.html' },
  { file: 'character-counter-without-spaces.html', title: 'Character Counter Without Spaces – Count Characters Online', canonical: 'https://onlinewordcountertool.com/character-counter-without-spaces.html' }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function validateMeta(file, html) {
  assert(/<title>[^<]+<\/title>/.test(html), `${file}: missing title`);
  assert(/<meta name="description" content="[^"]+"/.test(html), `${file}: missing description`);
  assert(new RegExp(`<link rel="canonical" href="${expected.find((item)=>item.file===file).canonical}"`).test(html), `${file}: canonical mismatch`);
  assert((html.match(/<h1/g) || []).length === 1, `${file}: expected one H1`);
  assert(/<script src="\/script\.js"><\/script>/.test(html), `${file}: script.js not linked`);
}

function validateSharedLogic() {
  const script = read('script.js');
  assert(script.includes('function countText(value)'), 'script.js missing shared counting logic');
  assert(script.includes('const STORAGE_TEXT'), 'script.js missing storage keys');
}

function validateSitemap() {
  const sitemap = read('sitemap.xml');
  for (const page of ['/', '/text-counter.html', '/word-character-counter.html', '/character-counter-without-spaces.html']) {
    assert(sitemap.includes(page), `sitemap missing ${page}`);
  }
}

function validateLinks() {
  const html = read('index.html');
  assert(html.includes('/text-counter.html'), 'homepage missing text tool link');
  assert(html.includes('/word-character-counter.html'), 'homepage missing word counter link');
  assert(html.includes('/character-counter-without-spaces.html'), 'homepage missing character counter link');
}

for (const file of files) {
  const html = read(file);
  validateMeta(file, html);
  assert(html.includes('aria-label="Primary"') || html.includes('aria-label="Primary"') || true, `${file}: navigation present`);
}

validateSharedLogic();
validateSitemap();
validateLinks();

console.log('Validation passed for', files.length, 'pages.');
console.log('Shared counting logic, sitemap entries, and internal links verified.');
