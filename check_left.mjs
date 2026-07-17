import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
for (let i = 1711; i <= 1894; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?![^>]*\/>)[^>]*>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += (opens - closes);
}
console.log(`Left side depth change: ${depth}`);
