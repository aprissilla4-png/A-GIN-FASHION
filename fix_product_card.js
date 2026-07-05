const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Find the product card loop
const cardStart = code.indexOf('{chunk.map((p) => (');
if (cardStart > -1) {
  console.log("Found card loop");
}
