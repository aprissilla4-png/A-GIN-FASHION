import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
for (let i = 1685; i <= 2343; i++) {
  const line = lines[i];
  const o = (line.match(/<div(\s|>)/g) || []).length;
  const c = (line.match(/<\/div>/g) || []).length;
  depth += (o - c);
  if (o > 0 || c > 0) {
     console.log(`Line ${i+1} [depth=${depth}]: ${line.trim()}`);
  }
}
