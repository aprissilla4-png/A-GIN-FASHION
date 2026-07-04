const fs = require('fs');

let serverFile = fs.readFileSync('server.ts', 'utf8');

if (!serverFile.includes('/api/categories')) {
  const insertPos = serverFile.indexOf('app.get("/api/products"');
  if (insertPos !== -1) {
    const apiCode = `
  // API - Categories
  app.get("/api/categories", (req, res) => {
    const dbData = loadDatabase();
    res.json(dbData.categories || []);
  });

  app.post("/api/categories", (req, res) => {
    const { id, label, image } = req.body;
    const dbData = loadDatabase();
    if (!dbData.categories) dbData.categories = [];
    dbData.categories.push({ id: id || label, label, image });
    saveDatabase(dbData);
    res.json({ success: true });
  });

  app.put("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const { label, image } = req.body;
    const dbData = loadDatabase();
    if (!dbData.categories) dbData.categories = [];
    const index = dbData.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      dbData.categories[index] = { ...dbData.categories[index], label, image };
      saveDatabase(dbData);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const dbData = loadDatabase();
    if (!dbData.categories) dbData.categories = [];
    dbData.categories = dbData.categories.filter(c => c.id !== id);
    saveDatabase(dbData);
    res.json({ success: true });
  });

`;
    serverFile = serverFile.slice(0, insertPos) + apiCode + serverFile.slice(insertPos);
    fs.writeFileSync('server.ts', serverFile);
    console.log("Added /api/categories");
  }
}
