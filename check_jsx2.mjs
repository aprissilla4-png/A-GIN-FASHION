import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

let depth = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  const opens = (line.match(/<div(?![^>]*\/>)[^>]*>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  depth += (opens - closes);
  
  if (i === 1643) {
     console.log(`Line ${i+1}: Depth is ${depth}, Line: ${line.trim()}`);
  }
}
console.log(`Final depth: ${depth}`);
