import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
// Scan only products tab (1685 to 2343)
for (let i = 1685; i <= 2343; i++) {
  const line = lines[i];
  
  // A simple hack to catch multi-line <div by looking for just "<div" without ">"
  // Actually, let's just count occurrences of "<div" and "</div>" literally!
  const o = (line.match(/<div\b/g) || []).length;
  const c = (line.match(/<\/div>/g) || []).length;
  
  depth += (o - c);
}
console.log(`Final depth: ${depth}`);
