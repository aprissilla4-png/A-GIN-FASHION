import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
if (!db.categories) {
  db.categories = [
    { id: "Women", label: "Women", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Men", label: "Men", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Batik", label: "Batik", image: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Sablon DTF", label: "Sablon DTF", image: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Streetwear", label: "Streetwear", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Outerwear", label: "Outerwear", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=200&h=200" },
    { id: "Promo", label: "Promo / Sale", image: "" }
  ];
  fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
}
