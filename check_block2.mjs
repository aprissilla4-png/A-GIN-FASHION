import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
for (let i = 1685; i <= 2344; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?![^>]*\/>)[^>]*>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += (opens - closes);
  console.log(`Line ${i+1} [depth=${depth}]: ${line.trim()}`);
}
