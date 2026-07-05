const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
const addRules = `
    match /designs/{designId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if isAdmin();
    }
`;
if (!rules.includes('/designs/')) {
  rules = rules.replace(/match \/users\//, addRules.trim() + '\n\n    match /users/');
  fs.writeFileSync('firestore.rules', rules);
  console.log("Updated rules");
}
