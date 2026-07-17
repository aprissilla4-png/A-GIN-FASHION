import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
for (let i = 1711; i <= 2197; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?![^>]*\/>)[^>]*>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += (opens - closes);
  if (depth < 0) {
      console.log(`Line ${i+1}: Depth is ${depth}`);
  }
}
