const fs = require('fs');
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

let depth = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div[^>]*>/g) || []).length;
  // This is a naive regex for closing divs
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += (opens - closes);
  if (depth < 0) {
    console.log(`Unbalanced at line ${i+1}: depth=${depth}, line=${line}`);
  }
}
console.log(`Final depth: ${depth}`);
