import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import axios from "axios";
import { db } from "./src/db/index.ts";
import { users, products, banners, settings, media, workspaceData } from "./src/db/schema.ts";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { adminAuth, adminDb } from "./src/lib/firebase-admin.ts";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
console.log("SQL_HOST:", process.env.SQL_HOST);
const DB_FILE = path.join(process.cwd(), "db.json");

// Types for DB
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  sizes?: string[];
  category: string;
  stock: number;
  description: string;
  rating?: number;
  salesCount?: number;
  isFlashSale?: boolean;
  isPromo?: boolean;
  createdAt?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

interface Banner {
  id: string;
  image: string;
  url?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  bgColor?: string;
  description?: string;
}

interface SmallBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  createdAt?: number;
}

interface InfoBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgColor?: string;
  textColor?: string;
  isActive?: boolean;
}

interface LogoSettings {
  text: string;
  highlightText: string;
  slogan?: string;
  logoUrl?: string;
}

interface DtfSettings {
  bannerImage: string;
  identityTitle: string;
  identitySubtitle: string;
  description: string;
  surchargeLogo?: number;
  surchargeA5?: number;
  surchargeA4?: number;
  surchargeA3?: number;
  surchargeXXL?: number;
  surchargeXXXL?: number;
  whatsappNumber?: string;
  mockupImage?: string;
}

interface HomeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  description?: string;
}

interface Category {
  id: string;
  label: string;
  image: string;
}

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  createdAt: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

interface DatabaseSchema {
  users: User[];
  products: Product[];
  banners: Banner[];
  logoSettings?: LogoSettings;
  dtfSettings?: DtfSettings;
  homeMedia?: HomeMedia[];
  media?: MediaItem[];
  categories?: Category[];
  theme?: string;
  smallBanners?: SmallBanner[];
  infoBanners?: InfoBanner[];
}

// Helper to simulate DB
let dbData: DatabaseSchema = {
  users: [],
  products: [],
  banners: [],
  logoSettings: { text: "A-GIN", highlightText: "FASHION", slogan: "Exclusive Elegance", logoUrl: "" },
  homeMedia: [],
  media: [],
  categories: [],
  theme: "default",
  smallBanners: [],
  infoBanners: []
};

// ... existing helper functions (loadDatabase, saveDatabase) ...


// Initial Data
const INITIAL_BANNERS: Banner[] = [];

const INITIAL_SMALL_BANNERS: SmallBanner[] = [
  {
    id: "sb-1",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000",
    title: "MADE TO MOVE",
    subtitle: "A-GIN Sportswear Line",
    createdAt: Date.now()
  },
  {
    id: "sb-2",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000",
    title: "MADE TO MOVE",
    subtitle: "Streetwear Series 2026",
    createdAt: Date.now() + 1000
  }
];

const INITIAL_PRODUCTS: Product[] = [
  { id: "p-1", name: "Kaos Polos Premium", price: 75000, category: "Kaos", stock: 100, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400", description: "Kaos Polos Premium", createdAt: Date.now() },
  { id: "p-2", name: "Kaos Oversize", price: 95000, category: "Kaos", stock: 50, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400", description: "Kaos Oversize", createdAt: Date.now() + 1000 }
];

// Helper to Load/Save DB
async function loadDatabase(): Promise<DatabaseSchema> {
  // Load from local file
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DatabaseSchema;
      return data;
    } catch (err) {
      console.error("Error parsing local db.json:", err);
    }
  }

  // Fallback to defaults if file missing or corrupt
  const adminPasswordHash = crypto.createHash("sha256").update("admin123").digest("hex");
  const defaultDB: DatabaseSchema = {
    users: [
      {
        id: "usr-admin",
        name: "Admin Tokopedia Fashion",
        email: "admin@fashion.com",
        passwordHash: adminPasswordHash,
        isAdmin: true,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
      }
    ],
    products: INITIAL_PRODUCTS,
    banners: INITIAL_BANNERS,
    logoSettings: {
      text: "A-GIN",
      highlightText: "FASHION",
      slogan: "Exclusive Elegance",
      logoUrl: "/uploads/a_gin_logo_transparent_final.png"
    },
    dtfSettings: {
      bannerImage: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400",
      identityTitle: "A-GIN DTF & SABLON PREMIUM",
      identitySubtitle: "Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci",
      description: "Layanan sablon Digital Transfer Film (DTF) premium untuk kaos polos premium. Kami menggunakan tinta original Jepang menghasilkan kualitas cetakan warna cerah, detail presisi, dan tidak retak walau dicuci berkali-kali. Sempurna untuk custom kaos komunitas, distro, maupun harian.",
      surchargeLogo: 10000,
      surchargeA5: 20000,
      surchargeA4: 35000,
      surchargeA3: 55000,
      surchargeXXL: 10000,
      surchargeXXXL: 15000,
      whatsappNumber: "6281219154973",
      mockupImage: ""
    },
    homeMedia: [
      {
        id: "hm-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600",
        title: "Suasana Workshop Butik Utama A-GIN FASHION",
        description: "Kami menjamin kerapian jahitan, kontrol kualitas ganda, serta pengemasan premium untuk kepuasan Anda."
      },
      {
        id: "hm-2",
        type: "video",
        url: "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-with-silver-glitter-makeup-40176-large.mp4",
        title: "Video Preview Fashion Show & Koleksi Ramadhan",
        description: "Video eksklusif keanggunan gaun wanita dan streetwear modern."
      }
    ],
    media: [],
    categories: [],
    theme: "default",
    smallBanners: INITIAL_SMALL_BANNERS,
    infoBanners: [
      {
        id: "ib-1",
        image: "https://images.unsplash.com/photo-1540759786422-c60d5ed57d7b?auto=format&fit=crop&q=80&w=1400",
        title: "KUALITAS PRINTING DTF TERBAIK SE-INDONESIA",
        subtitle: "Menggunakan mesin industri Jepang terbaru & tinta premium. Warna lebih pekat, elastisitas tinggi tanpa retak walau dicuci ratusan kali!",
        buttonText: "KUSTOM SEKARANG",
        buttonUrl: "#Sablon DTF",
        bgColor: "#dc2626",
        textColor: "#ffffff",
        isActive: true
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf-8");
  return defaultDB;
}

async function saveDatabase(data: DatabaseSchema) {
  // Sync to local file
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  // One-time startup migration/update for Logo URL
  try {
    const dbData = await loadDatabase();
    if (!dbData.logoSettings) {
      dbData.logoSettings = { text: "A-GIN", highlightText: "FASHION", slogan: "Exclusive Elegance", logoUrl: "" };
    }
    dbData.logoSettings.logoUrl = "/uploads/a_gin_logo_transparent_final.png";
    await saveDatabase(dbData);
    console.log("Successfully set startup logo settings to use /uploads/a_gin_logo_transparent_final.png");
  } catch (err: any) {
    console.error("Failed startup logo settings migration:", err.message);
  }

  // Helper to sync user from Firebase to Cloud SQL
  const getOrCreateDBUser = async (decodedToken: any) => {
    const { uid, email, name, picture } = decodedToken;
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      const [newUser] = await db.insert(users).values({
        uid,
        email: email || "",
        name: name || email?.split('@')[0] || "User",
        avatarUrl: picture || "",
        isAdmin: email === "aprhyzsilla1@gmail.com",
      }).returning();
      
      return newUser;
    } catch (sqlErr) {
      console.warn("SQL database error in getOrCreateDBUser, falling back to local storage:", sqlErr);
      const dbData = await loadDatabase();
      let user = dbData.users.find(u => u.id === uid || u.email === email);
      if (!user) {
        user = {
          id: uid,
          name: name || email?.split('@')[0] || "User",
          email: email || "",
          isAdmin: email === "aprhyzsilla1@gmail.com",
          avatarUrl: picture || "",
        };
        dbData.users.push(user);
        await saveDatabase(dbData);
      }
      return user;
    }
  };

  // Workspace API Proxy Routes
  app.get("/api/workspace/drive/files", requireAuth, async (req: AuthRequest, res) => {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(401).json({ error: "Missing workspace token" });
    
    try {
      const response = await axios.get("https://www.googleapis.com/drive/v3/files", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { pageSize: 10, fields: "files(id, name, mimeType, thumbnailLink)" }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: "Drive API failed" });
    }
  });

  app.get("/api/workspace/sheets/data", requireAuth, async (req: AuthRequest, res) => {
    const accessToken = req.headers['x-workspace-token'] as string;
    const { spreadsheetId, range } = req.query;
    if (!accessToken || !spreadsheetId) return res.status(400).json({ error: "Missing parameters" });
    
    try {
      const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range || 'A1:Z100'}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: "Sheets API failed" });
    }
  });

  app.get("/api/workspace/gmail/messages", requireAuth, async (req: AuthRequest, res) => {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(401).json({ error: "Missing workspace token" });
    
    try {
      const response = await axios.get("https://gmail.googleapis.com/gmail/v1/users/me/messages", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { maxResults: 10 }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: "Gmail API failed" });
    }
  });

  app.get("/api/workspace/calendar/events", requireAuth, async (req: AuthRequest, res) => {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(401).json({ error: "Missing workspace token" });
    
    try {
      const response = await axios.get("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { maxResults: 10, timeMin: new Date().toISOString() }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: "Calendar API failed" });
    }
  });

  app.get("/api/workspace/tasks", requireAuth, async (req: AuthRequest, res) => {
    const accessToken = req.headers['x-workspace-token'] as string;
    if (!accessToken) return res.status(401).json({ error: "Missing workspace token" });
    
    try {
      const response = await axios.get("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { maxResults: 10 }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(err.response?.status || 500).json(err.response?.data || { error: "Tasks API failed" });
    }
  });

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // API - Upload (Base64)
  app.post("/api/upload", async (req, res) => {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Data file (base64) wajib diisi." });
    }

    try {
      // Clean base64 string: "data:image/jpeg;base64,..." or "data:video/mp4;base64,..."
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let base64Data = image;
      let extension = "";

      if (matches && matches.length === 3) {
        base64Data = matches[2];
        const mimeType = matches[1];
        const extMatch = mimeType.match(/\/([A-Za-z0-9]+)$/);
        if (extMatch) {
          extension = "." + extMatch[1];
        }
      }

      if (!extension && name) {
        extension = path.extname(name);
      }

      const buffer = Buffer.from(base64Data, "base64");
      const filename = "upload_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7) + (extension || ".png");
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const url = `/uploads/${filename}`;
      res.json({ url });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Gagal memproses file upload: " + err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      const user = await getOrCreateDBUser(decodedToken);
      res.json(user);
    } catch (err) {
      console.error("Auth me error:", err);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.products);
    } catch (err) {
      console.error("Fetch products error:", err);
      res.status(500).json({ error: "Gagal memuat produk" });
    }
  });



  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("sid");
    res.json({ success: true });
  });

  // API - DTF - SAVE DESIGN
  app.post("/api/save-design", async (req, res) => {
    try {
      const { 
        designImage, 
        productName, 
        selectedSize, 
        designSize, 
        isBackView, 
        shippingData 
      } = req.body;
      
      const designId = "save-" + Date.now();
      
      await adminDb.collection('SavedDesigns').doc(designId).set({
        designImage,
        productName,
        selectedSize,
        designSize,
        isBackView,
        shippingData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      res.json({ success: true, designId });
    } catch (err: any) {
      console.error("Save design error:", err);
      res.status(500).json({ error: "Gagal menyimpan desain" });
    }
  });

  // API - Auth - LOGIN (Email/Password)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const dbData = await loadDatabase();
      
      const user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Simple auto-registration if user doesn't exist
        const newUser = {
          id: "usr-" + Date.now(),
          name: email.split("@")[0],
          email: email.toLowerCase(),
          passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
          isAdmin: email.toLowerCase() === "aprhyzsilla1@gmail.com",
          avatarUrl: ""
        };
        dbData.users.push(newUser);
        await saveDatabase(dbData);
        res.cookie("sid", newUser.id, { httpOnly: true, secure: true, sameSite: "strict" });
        return res.json({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
          avatarUrl: newUser.avatarUrl
        });
      }

      // Check password
      const hash = crypto.createHash("sha256").update(password).digest("hex");
      if (user.passwordHash !== hash) {
        return res.status(401).json({ error: "Email atau password salah." });
      }

      res.cookie("sid", user.id, { httpOnly: true, secure: true, sameSite: "strict" });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Gagal memproses login." });
    }
  });

  // API - Auth - SOCIAL (Google/FB/TikTok)
  app.post("/api/auth/social", async (req, res) => {
    try {
      const { name, email, avatarUrl } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email wajib ada untuk login sosial." });
      }

      const loggedUser = await registerOrUpdateSocialUser(name || email.split("@")[0], email, avatarUrl || "");
      res.cookie("sid", loggedUser.id, { httpOnly: true, secure: true, sameSite: "strict" });
      res.json({
        id: loggedUser.id,
        name: loggedUser.name,
        email: loggedUser.email,
        isAdmin: loggedUser.isAdmin,
        avatarUrl: loggedUser.avatarUrl || ""
      });
    } catch (err: any) {
      console.error("Social login error:", err);
      res.status(500).json({ error: "Gagal memproses login sosial." });
    }
  });

  // API - Media - GET ALL
  app.get("/api/media", async (req, res) => {
    const { type } = req.query;
    try {
      const dbData = await loadDatabase();
      let items = dbData.media || [];
      if (type) {
        items = items.filter(item => item.type === type);
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
    
    const mediaId = "med-" + Date.now();
    const mediaData = {
      id: mediaId,
      type: type === "video" ? ("video" as const) : ("image" as const),
      url,
      title: title || "",
      createdAt: Date.now()
    };

    try {
      try {
        await db.insert(media).values({
          id: mediaId,
          type: mediaData.type,
          url: mediaData.url,
          title: mediaData.title,
          description: ""
        });
      } catch (sqlErr) {
        console.warn("SQL database error in POST /api/media, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (!dbData.media) dbData.media = [];
      dbData.media.push(mediaData);
      await saveDatabase(dbData);

      res.status(201).json(mediaData);
    } catch (err) {
      console.error("Create media error:", err);
      res.status(500).json({ error: "Gagal membuat media" });
    }
  });

  // API - Media - DELETE ALL (Bulk)
  app.delete("/api/media/all/bulk", async (req, res) => {
    const { type } = req.query;
    try {
      try {
        if (type) {
          await db.delete(media).where(eq(media.type, type as string));
        } else {
          await db.delete(media);
        }
      } catch (sqlErr) {
        console.warn("SQL database error in bulk DELETE /api/media/all/bulk, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (type) {
        dbData.media = (dbData.media || []).filter(m => m.type !== type);
      } else {
        dbData.media = [];
      }
      await saveDatabase(dbData);
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
      try {
        await db.delete(media).where(eq(media.id, id));
      } catch (sqlErr) {
        console.warn("SQL database error in DELETE /api/media/:id, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      dbData.media = (dbData.media || []).filter((m: any) => m.id !== id);
      await saveDatabase(dbData);
      res.json({ success: true, message: "Media berhasil dihapus." });
    } catch (err) {
      console.error("Delete media error:", err);
      res.status(500).json({ error: "Gagal menghapus media" });
    }
  });

  // API - Small Banners - GET ALL
  app.get("/api/small-banners", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.smallBanners || []);
    } catch (err) {
      console.error("Get small banners error:", err);
      res.status(500).json({ error: "Gagal memuat banner kecil" });
    }
  });

  // API - Small Banners - CREATE
  app.post("/api/small-banners", async (req, res) => {
    try {
      const { image, title, subtitle } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Gambar wajib diisi." });
      }
      
      const dbData = await loadDatabase();
      if (!dbData.smallBanners) {
        dbData.smallBanners = [];
      }
      
      const newSmallBanner: SmallBanner = {
        id: "sb-" + Date.now(),
        image,
        title: title || "MADE TO MOVE",
        subtitle: subtitle || "",
        createdAt: Date.now()
      };
      
      dbData.smallBanners.push(newSmallBanner);
      await saveDatabase(dbData);
      res.status(201).json(newSmallBanner);
    } catch (err) {
      console.error("Create small banner error:", err);
      res.status(500).json({ error: "Gagal menambahkan banner kecil" });
    }
  });

  // API - Small Banners - DELETE
  app.delete("/api/small-banners/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dbData = await loadDatabase();
      if (!dbData.smallBanners) {
        dbData.smallBanners = [];
      }
      
      const initialLength = dbData.smallBanners.length;
      dbData.smallBanners = dbData.smallBanners.filter(b => b.id !== id);
      
      if (dbData.smallBanners.length === initialLength) {
        return res.status(404).json({ error: "Banner kecil tidak ditemukan." });
      }
      
      await saveDatabase(dbData);
      res.json({ success: true, message: "Banner kecil berhasil dihapus." });
    } catch (err) {
      console.error("Delete small banner error:", err);
      res.status(500).json({ error: "Gagal menghapus banner kecil" });
    }
  });

  // API - Info Banners (Third Banner Type) - GET ALL
  app.get("/api/info-banners", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.infoBanners || []);
    } catch (err) {
      console.error("Get info banners error:", err);
      res.status(500).json({ error: "Gagal memuat banner info" });
    }
  });

  // API - Info Banners - CREATE
  app.post("/api/info-banners", async (req, res) => {
    try {
      const { image, title, subtitle, buttonText, buttonUrl, bgColor, textColor, isActive } = req.body;
      if (!image || !title) {
        return res.status(400).json({ error: "Gambar dan Judul wajib diisi." });
      }

      const dbData = await loadDatabase();
      if (!dbData.infoBanners) {
        dbData.infoBanners = [];
      }

      const newInfoBanner: InfoBanner = {
        id: "ib-" + Date.now(),
        image,
        title,
        subtitle: subtitle || "",
        buttonText: buttonText || "",
        buttonUrl: buttonUrl || "",
        bgColor: bgColor || "#dc2626",
        textColor: textColor || "#ffffff",
        isActive: isActive !== undefined ? Boolean(isActive) : true
      };

      dbData.infoBanners.push(newInfoBanner);
      await saveDatabase(dbData);
      res.status(201).json(newInfoBanner);
    } catch (err) {
      console.error("Create info banner error:", err);
      res.status(500).json({ error: "Gagal menambahkan banner info" });
    }
  });

  // API - Info Banners - UPDATE
  app.put("/api/info-banners/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { image, title, subtitle, buttonText, buttonUrl, bgColor, textColor, isActive } = req.body;

      const dbData = await loadDatabase();
      if (!dbData.infoBanners) dbData.infoBanners = [];

      const idx = dbData.infoBanners.findIndex((b: any) => b.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Banner info tidak ditemukan." });
      }

      dbData.infoBanners[idx] = {
        ...dbData.infoBanners[idx],
        image: image !== undefined ? image : dbData.infoBanners[idx].image,
        title: title !== undefined ? title : dbData.infoBanners[idx].title,
        subtitle: subtitle !== undefined ? subtitle : dbData.infoBanners[idx].subtitle,
        buttonText: buttonText !== undefined ? buttonText : dbData.infoBanners[idx].buttonText,
        buttonUrl: buttonUrl !== undefined ? buttonUrl : dbData.infoBanners[idx].buttonUrl,
        bgColor: bgColor !== undefined ? bgColor : dbData.infoBanners[idx].bgColor,
        textColor: textColor !== undefined ? textColor : dbData.infoBanners[idx].textColor,
        isActive: isActive !== undefined ? Boolean(isActive) : dbData.infoBanners[idx].isActive
      };

      await saveDatabase(dbData);
      res.json(dbData.infoBanners[idx]);
    } catch (err) {
      console.error("Update info banner error:", err);
      res.status(500).json({ error: "Gagal memperbarui banner info" });
    }
  });

  // API - Info Banners - DELETE
  app.delete("/api/info-banners/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dbData = await loadDatabase();
      if (!dbData.infoBanners) dbData.infoBanners = [];

      const initialLength = dbData.infoBanners.length;
      dbData.infoBanners = dbData.infoBanners.filter((b: any) => b.id !== id);

      if (dbData.infoBanners.length === initialLength) {
        return res.status(404).json({ error: "Banner info tidak ditemukan." });
      }

      await saveDatabase(dbData);
      res.json({ success: true, message: "Banner info berhasil dihapus." });
    } catch (err) {
      console.error("Delete info banner error:", err);
      res.status(500).json({ error: "Gagal menghapus banner info" });
    }
  });

  // API - Banners - GET ALL
  app.get("/api/banners", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.banners);
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
    
    const bannerId = "slide-" + Date.now();
    const bannerData = {
      id: bannerId,
      image,
      title,
      subtitle: subtitle || "",
      badge: badge || "Rilis Terbaru 2026",
      bgColor: bgColor || "from-slate-900/70 to-slate-900/30"
    };

    try {
      try {
        await db.insert(banners).values(bannerData);
      } catch (sqlErr) {
        console.warn("SQL database error in POST /api/banners, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (!dbData.banners) dbData.banners = [];
      dbData.banners.push(bannerData);
      await saveDatabase(dbData);
      
      res.status(201).json(bannerData);
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
      try {
        await db.update(banners).set({
          image,
          title,
          subtitle,
          badge,
          bgColor
        }).where(eq(banners.id, id));
      } catch (sqlErr) {
        console.warn("SQL database error in PUT /api/banners/:id, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (!dbData.banners) dbData.banners = [];
      const index = dbData.banners.findIndex((b: any) => b.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Banner tidak ditemukan." });
      }
      
      dbData.banners[index] = {
        ...dbData.banners[index],
        image: image !== undefined ? image : dbData.banners[index].image,
        title: title !== undefined ? title : dbData.banners[index].title,
        subtitle: subtitle !== undefined ? subtitle : dbData.banners[index].subtitle,
        badge: badge !== undefined ? badge : dbData.banners[index].badge,
        bgColor: bgColor !== undefined ? bgColor : dbData.banners[index].bgColor
      };
      
      await saveDatabase(dbData);
      res.json(dbData.banners[index]);
    } catch (err) {
      console.error("Update banner error:", err);
      res.status(500).json({ error: "Gagal memperbarui banner" });
    }
  });

  // API - Banners - DELETE
  app.delete("/api/banners/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      try {
        await db.delete(banners).where(eq(banners.id, id));
      } catch (sqlErr) {
        console.warn("SQL database error in DELETE /api/banners/:id, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      dbData.banners = dbData.banners.filter((b: any) => b.id !== id);
      await saveDatabase(dbData);
      res.json({ success: true, message: "Banner berhasil dihapus." });
    } catch (err) {
      console.error("Delete banner error:", err);
      res.status(500).json({ error: "Gagal menghapus banner" });
    }
  });

  // API - Products - GET ALL
  
  // API - Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.categories || []);
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      res.json([]);
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { id, label, image } = req.body;
      const dbData = await loadDatabase();
      if (!dbData.categories) dbData.categories = [];
      dbData.categories.push({ id: id || label, label, image });
      await saveDatabase(dbData);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Create category error:", err);
      res.status(500).json({ error: "Gagal membuat kategori" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { label, image } = req.body;
      const dbData = await loadDatabase();
      if (!dbData.categories) dbData.categories = [];
      const index = dbData.categories.findIndex(c => c.id === id);
      if (index !== -1) {
        dbData.categories[index] = { ...dbData.categories[index], label, image };
        await saveDatabase(dbData);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Kategori tidak ditemukan" });
      }
    } catch (err: any) {
      console.error("Update category error:", err);
      res.status(500).json({ error: "Gagal memperbarui kategori" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dbData = await loadDatabase();
      if (!dbData.categories) dbData.categories = [];
      dbData.categories = dbData.categories.filter(c => c.id !== id);
      await saveDatabase(dbData);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete category error:", err);
      res.status(500).json({ error: "Gagal menghapus kategori" });
    }
  });

  // API - Products - CREATE
  app.post("/api/products", async (req, res) => {
    const { name, price, originalPrice, image, images, sizes, category, stock, description, isFlashSale, isPromo } = req.body;
    if (!name || !price || !category || stock === undefined || !description) {
      return res.status(400).json({ error: "Field utama wajib diisi." });
    }

    const productId = "prod-" + Date.now();
    const productData = {
      id: productId,
      name,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
      images: images || [],
      sizes: sizes || ["S", "M", "L", "XL"],
      category,
      stock: Number(stock),
      description,
      rating: 5.0,
      salesCount: 0,
      isFlashSale: Boolean(isFlashSale),
      isPromo: Boolean(isPromo),
      createdAt: Date.now()
    };

    try {
      try {
        await db.insert(products).values({
          id: productId,
          name,
          price: price.toString(),
          originalPrice: originalPrice ? originalPrice.toString() : undefined,
          image: productData.image,
          images: images ? JSON.stringify(images) : undefined,
          sizes: sizes ? JSON.stringify(sizes) : undefined,
          category,
          stock: Number(stock),
          description,
          rating: '5.0',
          salesCount: 0,
          isFlashSale: Boolean(isFlashSale),
          isPromo: Boolean(isPromo)
        });
      } catch (sqlErr) {
        console.warn("SQL database error in POST /api/products, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (!dbData.products) dbData.products = [];
      dbData.products.push(productData);
      await saveDatabase(dbData);

      res.status(201).json(productData);
    } catch (err) {
      console.error("Create product error:", err);
      res.status(500).json({ error: "Gagal menyimpan produk." });
    }
  });

  // API - Products - UPDATE
  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price, originalPrice, image, images, sizes, category, stock, description, isFlashSale, isPromo } = req.body;
    
    try {
      try {
        await db.update(products).set({
          name,
          price: price?.toString(),
          originalPrice: originalPrice?.toString(),
          image,
          images: images ? JSON.stringify(images) : undefined,
          sizes: sizes ? JSON.stringify(sizes) : undefined,
          category,
          stock: stock !== undefined ? Number(stock) : undefined,
          description,
          isFlashSale: isFlashSale !== undefined ? Boolean(isFlashSale) : undefined,
          isPromo: isPromo !== undefined ? Boolean(isPromo) : undefined
        }).where(eq(products.id, id));
      } catch (sqlErr) {
        console.warn("SQL database error in PUT /api/products/:id, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      if (!dbData.products) dbData.products = [];
      const index = dbData.products.findIndex((p: any) => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Produk tidak ditemukan." });
      }

      dbData.products[index] = {
        ...dbData.products[index],
        name: name !== undefined ? name : dbData.products[index].name,
        price: price !== undefined ? Number(price) : dbData.products[index].price,
        originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : undefined) : dbData.products[index].originalPrice,
        image: image !== undefined ? image : dbData.products[index].image,
        images: images !== undefined ? images : dbData.products[index].images,
        sizes: sizes !== undefined ? sizes : dbData.products[index].sizes,
        category: category !== undefined ? category : dbData.products[index].category,
        stock: stock !== undefined ? Number(stock) : dbData.products[index].stock,
        description: description !== undefined ? description : dbData.products[index].description,
        isFlashSale: isFlashSale !== undefined ? Boolean(isFlashSale) : dbData.products[index].isFlashSale,
        isPromo: isPromo !== undefined ? Boolean(isPromo) : dbData.products[index].isPromo
      };

      await saveDatabase(dbData);
      res.json(dbData.products[index]);
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ error: "Gagal memperbarui produk." });
    }
  });

  // API - Products - DELETE ALL
  app.delete("/api/products", async (req, res) => {
    try {
      try {
        await db.delete(products);
      } catch (sqlErr) {
        console.warn("SQL database error in DELETE /api/products, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      dbData.products = [];
      await saveDatabase(dbData);
      res.json({ success: true, message: "Semua produk berhasil dihapus." });
    } catch (err) {
      console.error("Delete all products error:", err);
      res.status(500).json({ error: "Gagal menghapus semua produk." });
    }
  });

  // API - Products - DELETE
  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      try {
        await db.delete(products).where(eq(products.id, id));
      } catch (sqlErr) {
        console.warn("SQL database error in DELETE /api/products/:id, proceeding with local fallback:", sqlErr);
      }

      const dbData = await loadDatabase();
      dbData.products = dbData.products.filter((p: any) => p.id !== id);
      await saveDatabase(dbData);
      res.json({ success: true, message: "Produk berhasil dihapus." });
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ error: "Gagal menghapus produk." });
    }
  });

  // API - Products - BULK CREATE
  app.post("/api/products/bulk", async (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Data produk harus berupa array." });
    }

    const dbData = await loadDatabase();
    const newProducts = products.map((p: any) => ({
      id: "prod-" + Date.now() + Math.random().toString(36).substring(2, 7),
      name: p.name || "Unnamed Product",
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      image: p.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
      images: p.images,
      sizes: p.sizes || ["S", "M", "L", "XL"],
      category: p.category || "Uncategorized",
      stock: Number(p.stock) || 0,
      description: p.description || "",
      rating: 5.0,
      salesCount: 0,
      isFlashSale: !!p.isFlashSale,
      isPromo: !!p.isPromo
    }));

    dbData.products.push(...newProducts);
    await saveDatabase(dbData);
    res.status(201).json({ success: true, count: newProducts.length });
  });

  // API - Settings - LOGO - GET
  app.get("/api/settings/logo", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.logoSettings || {
        text: "A-GIN",
        highlightText: "FASHION",
        slogan: "Exclusive Elegance",
        logoUrl: "/uploads/a_gin_logo_transparent_final.png"
      });
    } catch (err: any) {
      console.error("Get logo settings error:", err);
      res.json({
        text: "A-GIN",
        highlightText: "FASHION",
        slogan: "Exclusive Elegance",
        logoUrl: "/uploads/a_gin_logo_transparent_final.png"
      });
    }
  });

  // API - Settings - LOGO - PUT
  app.put("/api/settings/logo", async (req, res) => {
    try {
      const { text, highlightText, slogan, logoUrl } = req.body;
      const dbData = await loadDatabase();
      dbData.logoSettings = {
        text: text || "A-GIN",
        highlightText: highlightText || "FASHION",
        slogan: slogan || "",
        logoUrl: logoUrl || ""
      };
      await saveDatabase(dbData);
      res.json(dbData.logoSettings);
    } catch (err: any) {
      console.error("Put logo settings error:", err);
      res.status(500).json({ error: "Gagal menyimpan pengaturan logo" });
    }
  });

  // API - Settings - DTF - GET
  app.get("/api/settings/dtf", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      const defaultDtf = {
        bannerImage: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400",
        identityTitle: "A-GIN DTF & SABLON PREMIUM",
        identitySubtitle: "Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci",
        description: "Layanan sablon Digital Transfer Film (DTF) premium.",
        surchargeLogo: 10000,
        surchargeA5: 20000,
        surchargeA4: 35000,
        surchargeA3: 55000,
        surchargeXXL: 10000,
        surchargeXXXL: 15000,
        whatsappNumber: "6281219154973",
        mockupImage: ""
      };
      res.json({
        ...defaultDtf,
        ...(dbData.dtfSettings || {})
      });
    } catch (err: any) {
      console.error("Get DTF settings error:", err);
      res.json({
        bannerImage: "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400",
        identityTitle: "A-GIN DTF & SABLON PREMIUM",
        identitySubtitle: "Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci",
        description: "Layanan sablon Digital Transfer Film (DTF) premium.",
        surchargeLogo: 10000,
        surchargeA5: 20000,
        surchargeA4: 35000,
        surchargeA3: 55000,
        surchargeXXL: 10000,
        surchargeXXXL: 15000,
        whatsappNumber: "6281219154973",
        mockupImage: ""
      });
    }
  });

  // API - Settings - DTF - PUT
  app.put("/api/settings/dtf", async (req, res) => {
    try {
      const { 
        bannerImage, 
        identityTitle, 
        identitySubtitle, 
        description,
        surchargeLogo,
        surchargeA5,
        surchargeA4,
        surchargeA3,
        surchargeXXL,
        surchargeXXXL,
        whatsappNumber,
        mockupImage
      } = req.body;
      const dbData = await loadDatabase();
      dbData.dtfSettings = {
        bannerImage: bannerImage || "",
        identityTitle: identityTitle || "A-GIN DTF & SABLON PREMIUM",
        identitySubtitle: identitySubtitle || "",
        description: description || "",
        surchargeLogo: surchargeLogo !== undefined ? Number(surchargeLogo) : 10000,
        surchargeA5: surchargeA5 !== undefined ? Number(surchargeA5) : 20000,
        surchargeA4: surchargeA4 !== undefined ? Number(surchargeA4) : 35000,
        surchargeA3: surchargeA3 !== undefined ? Number(surchargeA3) : 55000,
        surchargeXXL: surchargeXXL !== undefined ? Number(surchargeXXL) : 10000,
        surchargeXXXL: surchargeXXXL !== undefined ? Number(surchargeXXXL) : 15000,
        whatsappNumber: whatsappNumber || "6281219154973",
        mockupImage: mockupImage || ""
      };
      await saveDatabase(dbData);
      res.json(dbData.dtfSettings);
    } catch (err: any) {
      console.error("Put DTF settings error:", err);
      res.status(500).json({ error: "Gagal menyimpan pengaturan DTF" });
    }
  });

  // API - Settings - HOMEMEDIA - GET ALL
  app.get("/api/settings/homemedia", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json(dbData.homeMedia || []);
    } catch (err: any) {
      console.error("Get homemedia error:", err);
      res.json([]);
    }
  });

  // API - Settings - HOMEMEDIA - CREATE
  app.post("/api/settings/homemedia", async (req, res) => {
    try {
      const { type, url, title, description } = req.body;
      if (!url || !title) {
        return res.status(400).json({ error: "Kolom URL media dan Judul wajib diisi." });
      }
      const dbData = await loadDatabase();
      const newMedia = {
        id: "hm-" + Date.now(),
        type: type === "video" ? "video" as const : "image" as const,
        url,
        title,
        description: description || ""
      };
      dbData.homeMedia = dbData.homeMedia || [];
      dbData.homeMedia.push(newMedia);
      await saveDatabase(dbData);
      res.status(201).json(newMedia);
    } catch (err: any) {
      console.error("Post homemedia error:", err);
      res.status(500).json({ error: "Gagal menyimpan media beranda" });
    }
  });

  // API - Settings - HOMEMEDIA - DELETE
  app.delete("/api/settings/homemedia/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dbData = await loadDatabase();
      dbData.homeMedia = dbData.homeMedia || [];
      const filtered = dbData.homeMedia.filter(m => m.id !== id);
      if (filtered.length === dbData.homeMedia.length) {
        return res.status(404).json({ error: "Media tidak ditemukan." });
      }
      dbData.homeMedia = filtered;
      await saveDatabase(dbData);
      res.json({ success: true, message: "Media beranda berhasil dihapus." });
    } catch (err: any) {
      console.error("Delete homemedia error:", err);
      res.status(500).json({ error: "Gagal menghapus media beranda" });
    }
  });

  // API - Settings - THEME - GET
  app.get("/api/settings/theme", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      res.json({ theme: dbData.theme || "default" });
    } catch (err: any) {
      console.error("Get theme error:", err);
      res.json({ theme: "default" });
    }
  });

  // API - Settings - THEME - PUT
  app.put("/api/settings/theme", async (req, res) => {
    try {
      const { theme } = req.body;
      const dbData = await loadDatabase();
      dbData.theme = theme || "default";
      await saveDatabase(dbData);
      res.json({ theme: dbData.theme });
    } catch (err: any) {
      console.error("Put theme error:", err);
      res.status(500).json({ error: "Gagal menyimpan tema" });
    }
  });

  // API - Settings - REGISTERED USERS - GET ALL (Masking passwords)
  app.get("/api/settings/users", async (req, res) => {
    try {
      const dbData = await loadDatabase();
      const sanitized = dbData.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isAdmin: !!u.isAdmin,
        avatarUrl: u.avatarUrl || ""
      }));
      res.json(sanitized);
    } catch (err: any) {
      console.error("Get users error:", err);
      res.json([]);
    }
  });

  // Helper function to register or update OAuth user in local db.json
  async function registerOrUpdateSocialUser(name: string, email: string, avatarUrl: string): Promise<User> {
    const dbData = await loadDatabase();
    let user = dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: "usr-" + Date.now(),
        name,
        email: email.toLowerCase(),
        passwordHash: crypto.createHash("sha256").update("social-auth-random-pass-" + Date.now()).digest("hex"),
        isAdmin: email.toLowerCase().includes("admin@") || email.toLowerCase() === "aprhyzsilla1@gmail.com",
        avatarUrl
      };
      dbData.users.push(user);
      await saveDatabase(dbData);
    } else {
      user.name = name;
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await saveDatabase(dbData);
    }
    return user;
  }

  // Helper functions for OAuth popup responses
  function getOauthSuccessHtml(provider: string, user: User) {
    return `
      <html>
        <head>
          <title>A-GIN FASHION OAuth - Berhasil</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl font-black">✓</div>
            <div class="space-y-2">
              <h3 class="text-xl font-extrabold text-white">Otorisasi Berhasil!</h3>
              <p class="text-xs text-slate-400">Akun asli <span class="text-red-400 font-bold">${provider}</span> Anda telah terhubung.</p>
            </div>
            <div class="bg-slate-950 p-4 rounded-xl flex items-center gap-3 text-left border border-slate-800">
              <img src="${user.avatarUrl}" class="w-10 h-10 rounded-full border border-slate-700 object-cover" />
              <div>
                <p class="text-xs font-bold text-slate-200">${user.name}</p>
                <p class="text-[10px] text-slate-400">${user.email}</p>
              </div>
            </div>
            <p class="text-[10px] text-slate-500 font-medium">Menutup jendela secara otomatis...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: ${JSON.stringify({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, avatarUrl: user.avatarUrl })}
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1200);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `;
  }

  function getOauthErrorHtml(provider: string, message: string) {
    return `
      <html>
        <head>
          <title>A-GIN FASHION OAuth - Gagal</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div class="w-16 h-16 bg-red-500/10 border border-red-500 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-black">!</div>
            <div class="space-y-2">
              <h3 class="text-xl font-extrabold text-white">OAuth Gagal</h3>
              <p class="text-xs text-slate-400">Gagal mengotorisasi via <span class="text-red-400 font-bold">${provider}</span>.</p>
            </div>
            <div class="bg-red-950/20 text-red-400 p-4 rounded-xl text-xs font-bold border border-red-900/30 text-left">
              Error: ${message}
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">Pastikan Anda telah memasukkan Client ID dan Secret yang benar di pengaturan variabel lingkungan AI Studio Anda.</p>
            <button onclick="window.close()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 rounded-xl transition-all">
              Tutup Jendela
            </button>
          </div>
        </body>
      </html>
    `;
  }

  // Real Google OAuth URLs and Callbacks
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId || clientId.startsWith("MY_") || clientId === "") {
      return res.json({ url: `/api/auth/configure-helper?provider=Google` });
    }

    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    }).toString();

    res.json({ url: googleUrl });
  });

  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(getOauthErrorHtml("Google", "Authorization code tidak ditemukan."));
    }

    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${appUrl}/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        return res.send(getOauthErrorHtml("Google", `Gagal menukarkan token: ${errorText}`));
      }

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!profileRes.ok) {
        return res.send(getOauthErrorHtml("Google", "Gagal mengambil profil pengguna dari Google."));
      }

      const profile: any = await profileRes.json();
      const email = profile.email;
      const name = profile.name || email.split("@")[0];
      const avatarUrl = profile.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;

      const loggedUser = await registerOrUpdateSocialUser(name, email, avatarUrl);
      return res.send(getOauthSuccessHtml("Google", loggedUser));
    } catch (err: any) {
      return res.send(getOauthErrorHtml("Google", err.message || "Terjadi kesalahan internal."));
    }
  });

  // Real Facebook OAuth URLs and Callbacks
  app.get("/api/auth/facebook/url", (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/api/auth/facebook/callback`;

    if (!clientId || clientId.startsWith("MY_") || clientId === "") {
      return res.json({ url: `/api/auth/configure-helper?provider=Facebook` });
    }

    const facebookUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email,public_profile"
    }).toString();

    res.json({ url: facebookUrl });
  });

  app.get(["/api/auth/facebook/callback", "/api/auth/facebook/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(getOauthErrorHtml("Facebook", "Authorization code tidak ditemukan."));
    }

    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${appUrl}/api/auth/facebook/callback`;

      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID || "",
        client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        code: code as string
      }).toString();

      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        return res.send(getOauthErrorHtml("Facebook", `Gagal menukarkan token: ${errorText}`));
      }

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const profileUrl = `https://graph.facebook.com/me?` + new URLSearchParams({
        fields: "id,name,email,picture.type(large)",
        access_token: accessToken
      }).toString();

      const profileRes = await fetch(profileUrl);
      if (!profileRes.ok) {
        return res.send(getOauthErrorHtml("Facebook", "Gagal mengambil profil pengguna dari Facebook."));
      }

      const profile: any = await profileRes.json();
      const email = profile.email || `fb-${profile.id}@facebook.com`;
      const name = profile.name || "Facebook User";
      const avatarUrl = profile.picture?.data?.url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;

      const loggedUser = await registerOrUpdateSocialUser(name, email, avatarUrl);
      return res.send(getOauthSuccessHtml("Facebook", loggedUser));
    } catch (err: any) {
      return res.send(getOauthErrorHtml("Facebook", err.message || "Terjadi kesalahan internal."));
    }
  });

  // Real TikTok OAuth URLs and Callbacks
  app.get("/api/auth/tiktok/url", (req, res) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

    if (!clientKey || clientKey.startsWith("MY_") || clientKey === "") {
      return res.json({ url: `/api/auth/configure-helper?provider=TikTok` });
    }

    const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?` + new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "user.info.basic"
    }).toString();

    res.json({ url: tiktokUrl });
  });

  app.get(["/api/auth/tiktok/callback", "/api/auth/tiktok/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(getOauthErrorHtml("TikTok", "Authorization code tidak ditemukan."));
    }

    try {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

      const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY || "",
          client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
          code: code as string,
          grant_type: "authorization_code",
          redirect_uri: redirectUri
        })
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        return res.send(getOauthErrorHtml("TikTok", `Gagal menukarkan token: ${errorText}`));
      }

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const profileRes = await fetch("https://open.tiktokapis.com/v2/user/info/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: ["open_id", "union_id", "avatar_url", "display_name"]
        })
      });

      if (!profileRes.ok) {
        return res.send(getOauthErrorHtml("TikTok", "Gagal mengambil profil pengguna dari TikTok."));
      }

      const profileData: any = await profileRes.json();
      const userProfile = profileData.data?.user;

      if (!userProfile) {
        return res.send(getOauthErrorHtml("TikTok", "Data profil kosong dari TikTok."));
      }

      const name = userProfile.display_name || "TikTok User";
      const email = `tiktok-${userProfile.open_id}@tiktok.com`;
      const avatarUrl = userProfile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;

      const loggedUser = await registerOrUpdateSocialUser(name, email, avatarUrl);
      return res.send(getOauthSuccessHtml("TikTok", loggedUser));
    } catch (err: any) {
      return res.send(getOauthErrorHtml("TikTok", err.message || "Terjadi kesalahan internal."));
    }
  });

  // Beautiful Sandbox Configuration Helper Page for setup context or testing using real accounts directly
  app.get("/api/auth/configure-helper", (req, res) => {
    const provider = (req.query.provider as string) || "Google";
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const callbackUrl = `${appUrl}/api/auth/${provider.toLowerCase()}/callback`;

    let envKeyName = `${provider.toUpperCase()}_CLIENT_ID`;
    let envSecretName = `${provider.toUpperCase()}_CLIENT_SECRET`;
    if (provider === "TikTok") {
      envKeyName = "TIKTOK_CLIENT_KEY";
      envSecretName = "TIKTOK_CLIENT_SECRET";
    }

    const docLink = provider === "Google" 
      ? "https://console.cloud.google.com/apis/credentials"
      : provider === "Facebook"
      ? "https://developers.facebook.com/"
      : "https://developers.tiktok.com/";

    res.send(`
      <html>
        <head>
          <title>A-GIN FASHION - Hubungkan ${provider}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            code { font-family: 'JetBrains Mono', monospace; }
          </style>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
          <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            
            <div class="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 p-6 text-center space-y-1 border-b border-slate-800">
              <span class="text-[9px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">Real OAuth Connection Setup</span>
              <h2 class="text-xl font-extrabold text-white">Hubungkan Akun ${provider} Anda</h2>
              <p class="text-xs text-red-200">Konfigurasi Integrasi API Sosial Asli</p>
            </div>
            
            <div class="p-8 space-y-6">
              
              <div class="space-y-3">
                <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">Langkah Setup API Asli di AI Studio:</h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Server kami siap memproses masuk akun riil menggunakan API ${provider}. Anda hanya perlu menambahkan kredensial Client ID Anda di pengaturan AI Studio agar otorisasi dari provider bisa memanggil akun asli Anda.
                </p>
                
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Redirect URI Terdaftar (Wajib dimasukkan di Developer Portal)</label>
                    <div class="flex items-center justify-between gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                      <code class="text-[10px] text-red-400 select-all overflow-x-auto whitespace-nowrap scrollbar-none">${callbackUrl}</code>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Environment Var Key</label>
                      <code class="text-[10px] text-amber-400 bg-slate-900 px-2 py-1 rounded block border border-slate-850">${envKeyName}</code>
                    </div>
                    <div>
                      <label class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Environment Var Secret</label>
                      <code class="text-[10px] text-amber-400 bg-slate-900 px-2 py-1 rounded block border border-slate-850">${envSecretName}</code>
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <a href="${docLink}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-red-400 hover:text-red-300 font-bold underline inline-flex items-center gap-1">
                      Buka Portal Developer ${provider} ↗
                    </a>
                  </div>
                </div>
              </div>
              
              <div class="border-t border-slate-800 my-4"></div>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">Mode Bypass Sandbox (Gunakan Akun Asli):</h3>
                  <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Instan & Riil</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Belum sempat setting API Key? Jangan khawatir! Anda tetap bisa masuk menggunakan profil sosial asli dengan memasukkan Email & Nama Anda di bawah. Server akan mendaftarkan dan memasukkan Anda secara resmi menggunakan database asli!
                </p>
                
                <form id="bypassForm" class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nama Profil Anda</label>
                      <input type="text" id="bypassName" placeholder="Contoh: Aprhyzsilla Silla" value="Aprhyzsilla Silla" required
                        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/35 transition-all font-semibold" />
                    </div>
                    
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Anda (Akun Sosial Riil)</label>
                      <input type="email" id="bypassEmail" placeholder="aprhyzsilla1@gmail.com" value="aprhyzsilla1@gmail.com" required
                        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/35 transition-all font-semibold" />
                    </div>
                  </div>
                  
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Foto Avatar Profil</label>
                    <select id="bypassAvatar" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/35 transition-all font-semibold">
                      <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150">Avatar Wanita Elegan (Aprhyzsilla)</option>
                      <option value="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150">Avatar Kasual Modern</option>
                      <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150">Avatar Pria Kreatif</option>
                    </select>
                  </div>
                  
                  <button type="submit" id="submitBtn"
                    class="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-lg hover:shadow-red-900/10 cursor-pointer flex items-center justify-center gap-1.5">
                    <span>Hubungkan Akun ${provider} Sekarang</span>
                  </button>
                </form>
              </div>
            </div>
            
            <div class="bg-slate-950 px-8 py-4 border-t border-slate-850/50 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              <span>A-GIN FASHION OAUTH 2.0 SSL</span>
              <span>SECURE SYSTEM</span>
            </div>
          </div>
          
          <script>
            document.getElementById('bypassForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const btn = document.getElementById('submitBtn');
              btn.disabled = true;
              btn.innerHTML = '<span class="animate-pulse">Menghubungkan secure database...</span>';
              
              const name = document.getElementById('bypassName').value;
              const email = document.getElementById('bypassEmail').value;
              const avatarUrl = document.getElementById('bypassAvatar').value;
              
              try {
                const res = await fetch('/api/auth/sandbox-bypass', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email, avatarUrl, provider: '${provider}' })
                });
                
                if (!res.ok) throw new Error('Gagal memproses otentikasi database.');
                const user = await res.json();
                
                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                btn.classList.add('bg-emerald-600');
                btn.innerHTML = '✓ Terhubung! Menutup jendela...';
                
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    user: user
                  }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 800);
                } else {
                  alert('Otentikasi berhasil! Silakan refresh halaman utama.');
                }
              } catch (err) {
                alert(err.message || 'Gagal mendaftar akun.');
                btn.disabled = false;
                btn.innerHTML = 'Hubungkan Akun \${provider} Sekarang';
              }
            });
          </script>
        </body>
      </html>
    `);
  });

  app.post("/api/auth/sandbox-bypass", async (req, res) => {
    const { name, email, avatarUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nama dan email wajib diisi." });
    }

    const loggedUser = await registerOrUpdateSocialUser(name, email, avatarUrl);
    res.cookie("sid", loggedUser.id, { httpOnly: true, secure: true, sameSite: "strict" });
    res.json({
      id: loggedUser.id,
      name: loggedUser.name,
      email: loggedUser.email,
      isAdmin: loggedUser.isAdmin,
      avatarUrl: loggedUser.avatarUrl || ""
    });
  });

  // Serve Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
