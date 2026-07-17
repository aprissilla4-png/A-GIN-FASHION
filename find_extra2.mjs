import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
for (let i = 2343; i <= 2707; i++) {
  const line = lines[i];
  const o = (line.match(/<div\b/g) || []).length;
  const c = (line.match(/<\/div>/g) || []).length;
  depth += (o - c);
}
console.log(`Banners depth: ${depth}`);
