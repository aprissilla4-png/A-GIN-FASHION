const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ API - Banners - GET ALL([\s\S]*?)\/\/ API - Products/g;
const replacement = `// API - Banners - GET ALL
  app.get("/api/banners", async (req, res) => {
    try {
      const allBanners = await db.select().from(banners);
      res.json(allBanners);
    } catch (err) {
      res.status(500).json({ error: "Gagal memuat banner" });
    }
  });

  // API - Banners - CREATE
  app.post("/api/banners", async (req, res) => {
    const { image, title, subtitle, badge, bgColor } = req.body;
    if (!image || !title) {
      return res.status(400).json({ error: "Kolom Gambar dan Judul wajib diisi." });
    }
    
    try {
      const [newBanner] = await db.insert(banners).values({
        id: "slide-" + Date.now(),
        image,
        title,
        subtitle: subtitle || "",
        badge: badge || "Rilis Terbaru 2026",
        bgColor: bgColor || "from-slate-900/70 to-slate-900/30"
      }).returning();
      res.status(201).json(newBanner);
    } catch (err) {
      console.error("Create banner error:", err);
      res.status(500).json({ error: "Gagal membuat banner" });
    }
  });

  // API - Banners - UPDATE
  app.put("/api/banners/:id", async (req, res) => {
    const { id } = req.params;
    const { image, title, subtitle, badge, bgColor } = req.body;
    
    try {
      const [updatedBanner] = await db.update(banners).set({
        image,
        title,
        subtitle,
        badge,
        bgColor
      }).where(eq(banners.id, id)).returning();
      
      if (!updatedBanner) {
        return res.status(404).json({ error: "Banner tidak ditemukan." });
      }
      res.json(updatedBanner);
    } catch (err) {
      console.error("Update banner error:", err);
      res.status(500).json({ error: "Gagal memperbarui banner" });
    }
  });

  // API - Banners - DELETE
  app.delete("/api/banners/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      const deleted = await db.delete(banners).where(eq(banners.id, id)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Banner tidak ditemukan." });
      }
      res.json({ success: true, message: "Banner berhasil dihapus." });
    } catch (err) {
      console.error("Delete banner error:", err);
      res.status(500).json({ error: "Gagal menghapus banner" });
    }
  });

  // API - Products`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
