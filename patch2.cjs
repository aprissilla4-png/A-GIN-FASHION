const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ API - Media - GET ALL([\s\S]*?)\/\/ API - Banners - GET ALL/g;
const replacement = `// API - Media - GET ALL
  app.get("/api/media", async (req, res) => {
    const { type } = req.query;
    try {
      let items;
      if (type) {
        items = await db.select().from(media).where(eq(media.type, type as string));
      } else {
        items = await db.select().from(media);
      }
      res.json(items);
    } catch (err) {
      console.error("Fetch media error:", err);
      res.status(500).json({ error: "Gagal memuat media" });
    }
  });

  // API - Media - CREATE
  app.post("/api/media", async (req, res) => {
    const { type, url, title } = req.body;
    if (!url || !type) {
      return res.status(400).json({ error: "URL dan tipe media wajib diisi." });
    }
    
    try {
      const [newMedia] = await db.insert(media).values({
        id: "med-" + Date.now(),
        type: type === "video" ? "video" : "image",
        url,
        title: title || "",
        description: ""
      }).returning();
      res.status(201).json(newMedia);
    } catch (err) {
      console.error("Create media error:", err);
      res.status(500).json({ error: "Gagal membuat media" });
    }
  });

  // API - Media - DELETE ALL (Bulk)
  app.delete("/api/media/all/bulk", async (req, res) => {
    const { type } = req.query;
    try {
      if (type) {
        await db.delete(media).where(eq(media.type, type as string));
      } else {
        await db.delete(media);
      }
      res.json({ success: true, message: "Semua media berhasil dihapus." });
    } catch (err) {
      console.error("Delete bulk media error:", err);
      res.status(500).json({ error: "Gagal menghapus semua media" });
    }
  });

  // API - Media - DELETE
  app.delete("/api/media/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await db.delete(media).where(eq(media.id, id)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Media tidak ditemukan." });
      }
      res.json({ success: true, message: "Media berhasil dihapus." });
    } catch (err) {
      console.error("Delete media error:", err);
      res.status(500).json({ error: "Gagal menghapus media" });
    }
  });

  // API - Banners - GET ALL`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
