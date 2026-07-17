import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

const breaks = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(") : adminTab ===")) breaks.push(i);
}
breaks.push(lines.length - 1);

let start = 1684;
for (const b of breaks) {
  if (b < start) continue;
  let depth = 0;
  for (let i = start; i <= b; i++) {
    const o = (lines[i].match(/<div\b/g) || []).length;
    const c = (lines[i].match(/<\/div>/g) || []).length;
    depth += (o - c);
  }
  console.log(`Block ${start}-${b} depth: ${depth}`);
  start = b;
}
