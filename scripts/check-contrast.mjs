// WCAG 2.2 AA contrast check for every text/background pair the public site uses.
// Run: node scripts/check-contrast.mjs   (exits 1 if any pair fails)
//
// Thresholds: 4.5:1 normal text, 3:1 large text (24px+, or 18.66px+ bold) and
// non-text UI such as icons and focus rings.

const palette = {
  ivory: '#F7F3EC',
  white: '#FFFFFF',
  sand: '#EFE9DF', // secondary sections, muted surfaces
  navy: '#0B1B33',
  navyDeep: '#071226',
  stone: '#5E6470',
  gold: '#B08D57',
  goldInk: '#8A6A2F',
  onNavyMuted: '#C9CFD9',
  destructive: '#A3261F',
};

const pairs = [
  // [label, foreground, background, use: 'text' | 'large' | 'ui']
  ['Body text on ivory', 'navy', 'ivory', 'text'],
  ['Body text on white card', 'navy', 'white', 'text'],
  ['Body text on sand section', 'navy', 'sand', 'text'],
  ['Secondary text (stone) on ivory', 'stone', 'ivory', 'text'],
  ['Secondary text (stone) on white', 'stone', 'white', 'text'],
  ['Secondary text (stone) on sand', 'stone', 'sand', 'text'],
  ['Gold ink text on ivory', 'goldInk', 'ivory', 'text'],
  ['Gold ink text on white', 'goldInk', 'white', 'text'],
  ['Gold text on navy', 'gold', 'navy', 'text'],
  ['Gold text on deep navy', 'gold', 'navyDeep', 'text'],
  ['Ivory text on navy (buttons, dark sections)', 'ivory', 'navy', 'text'],
  ['Ivory text on deep navy', 'ivory', 'navyDeep', 'text'],
  ['Muted text on navy', 'onNavyMuted', 'navy', 'text'],
  ['Muted text on deep navy', 'onNavyMuted', 'navyDeep', 'text'],
  ['Error text on white', 'destructive', 'white', 'text'],
  ['Error text on ivory', 'destructive', 'ivory', 'text'],
  ['Gold rule / icon on navy', 'gold', 'navy', 'ui'],
  ['Gold ink icon on ivory', 'goldInk', 'ivory', 'ui'],
  ['Focus ring (navy) on ivory', 'navy', 'ivory', 'ui'],
  ['Focus ring (navy) on white', 'navy', 'white', 'ui'],
  ['Input border-equivalent: navy 22% on white (decorative, not a requirement)', null, null, 'skip'],
];

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const need = { text: 4.5, large: 3, ui: 3 };
let failures = 0;
const rows = [];
for (const [label, fg, bg, use] of pairs) {
  if (use === 'skip') continue;
  const r = ratio(palette[fg], palette[bg]);
  const pass = r >= need[use];
  if (!pass) failures++;
  rows.push({ pair: label, fg: palette[fg], bg: palette[bg], ratio: `${r.toFixed(2)}:1`, needs: `${need[use]}:1`, result: pass ? 'PASS' : 'FAIL' });
}
console.table(rows);
console.log(failures ? `${failures} pair(s) fail WCAG 2.2 AA` : 'All pairs meet WCAG 2.2 AA');
process.exit(failures ? 1 : 0);
