const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
if (!db.categories) {
  db.categories = [
    { id: "cat-1", name: "Women", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "cat-2", name: "Men", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "cat-3", name: "Batik", image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "cat-4", name: "Sablon DTF", image: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=200&h=200" }
  ];
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
}
