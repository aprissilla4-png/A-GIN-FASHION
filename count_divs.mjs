import fs from 'fs';
const content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');

let opens = 0;
let closes = 0;

for (let i = 1685; i <= 2343; i++) {
  const line = lines[i];
  // More robust regex
  const o = (line.match(/<div(\s|>)/g) || []).length;
  const c = (line.match(/<\/div>/g) || []).length;
  opens += o;
  closes += c;
}

console.log(`Products Block: opens=${opens}, closes=${closes}, diff=${opens - closes}`);
