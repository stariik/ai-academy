import mammoth from 'mammoth';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node check-course.mjs <docx-path>');
  process.exit(1);
}

const r = await mammoth.extractRawText({ path });
const text = r.value;

const lessonHeadings = text.match(/## გაკვეთილი \d+[^\n]*/g) || [];
console.log(`\n=== LESSONS: ${lessonHeadings.length} ===`);
lessonHeadings.forEach((h) => console.log('  ' + h.trim()));

const labels = [
  'კონცეფცია:',
  'მაგალითი:',
  'ვარჯიში:',
  'მცდარი წარმოდგენები:',
  'რეალური გამოყენება:',
  'ხიდი წინა გაკვეთილიდან:',
  'გასაღები:',
];
console.log('\n=== SUBSECTION COUNTS ===');
for (const lab of labels) {
  const matches = text.split(lab).length - 1;
  console.log(`  ${lab.padEnd(28)} = ${matches}`);
}

console.log('\n=== LESSON WORD COUNTS ===');
const bodies = text.split(/## გაკვეთილი \d+[^\n]*\n/);
for (let i = 1; i < bodies.length; i++) {
  const body = bodies[i].split(/\n## /)[0];
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  console.log(`  Lesson ${i.toString().padStart(2, '0')} = ${words} words  ${words < 500 ? '(UNDER 500!)' : words > 700 ? '(OVER 700!)' : 'OK'}`);
}

const stats = text.match(/ხანგრძლივობა:[^\n]*/);
console.log('\n=== STATS LINE ===');
console.log('  ' + (stats ? stats[0].trim() : '(not found)'));

const checkmarks = (text.match(/✓/g) || []).length;
const legacyChecks = (text.match(/✔/g) || []).length;
console.log('\n=== CHECKMARKS ===');
console.log(`  ✓ (U+2713): ${checkmarks}`);
console.log(`  ✔ (wrong):  ${legacyChecks}`);

const emdashInHeadings = lessonHeadings.filter((h) => h.includes('—')).length;
const hyphenInHeadings = lessonHeadings.filter((h) => /\d+\s*-\s/.test(h.replace('გაკვეთილი', ''))).length;
console.log('\n=== EM-DASH CHECK ===');
console.log(`  Headings with — : ${emdashInHeadings}/${lessonHeadings.length}`);
console.log(`  Headings with -  : ${hyphenInHeadings}`);

const georgianD = text.includes('დონე:');
const latinD = /\bdონე:/i.test(text);
console.log('\n=== TYPO CHECK ===');
console.log(`  "დონე:" (Georgian დ): ${georgianD ? 'YES' : 'NO'}`);
console.log(`  "dონე:" (Latin d):    ${latinD ? 'YES' : 'NO'}`);

// Stats consistency check
const durationMatch = stats ? stats[0].match(/(\d+)\s*კვირა\s*·\s*(\d+)\s*გაკვეთილი/) : null;
if (durationMatch) {
  const claimedLessons = parseInt(durationMatch[2]);
  console.log('\n=== STATS CONSISTENCY ===');
  console.log(`  Claimed lessons: ${claimedLessons}`);
  console.log(`  Actual lessons:  ${lessonHeadings.length}`);
  console.log(`  Match: ${claimedLessons === lessonHeadings.length ? 'YES' : 'NO'}`);
}

// Check lesson 01 omits bridge, lessons 02+ include it
console.log('\n=== BRIDGE PRESENCE ===');
for (let i = 1; i < bodies.length; i++) {
  const body = bodies[i].split(/\n## /)[0];
  const hasBridge = body.includes('ხიდი წინა გაკვეთილიდან:');
  const shouldHave = i >= 2;
  const ok = shouldHave === hasBridge;
  console.log(`  Lesson ${i.toString().padStart(2, '0')}: has bridge = ${hasBridge}  expected = ${shouldHave}  ${ok ? 'OK' : 'MISMATCH'}`);
}
