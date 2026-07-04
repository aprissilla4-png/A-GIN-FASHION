import fs from 'fs';

let adminFile = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const sidebarTabsCode = `
            <button
              onClick={() => setAdminTab("categories")}
              className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider \${
                adminTab === "categories"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }\`}
            >
              <Package className="w-4 h-4" />
              <span>Kategori & Ikon</span>
            </button>
            <button
              onClick={() => setAdminTab("videos")}
              className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider \${
                adminTab === "videos"
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }\`}
            >
              <Play className="w-4 h-4" />
              <span>Video Produk</span>
            </button>
`;

if (!adminFile.includes('<span>Kategori & Ikon</span>')) {
  adminFile = adminFile.replace(
    /<span>Kelola Banner Utama<\/span>\s*<\/button>/,
    '<span>Kelola Banner Utama</span>\n            </button>\n' + sidebarTabsCode
  );
  fs.writeFileSync('src/components/AdminPanel.tsx', adminFile);
  console.log("Fixed Admin Sidebar");
} else {
  console.log("Already has Kategori & Ikon in sidebar.");
}
