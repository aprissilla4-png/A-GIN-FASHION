import fs from 'fs';

let adminFile = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add fetch logic for categories and videos
const fetchCode = `
  const [categories, setCategories] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [catLabel, setCatLabel] = useState("");
  const [catImage, setCatImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.filter((m: any) => m.type === "video"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminTab === "categories") fetchCategories();
    else if (adminTab === "videos") fetchVideos();
  }, [adminTab]);

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    if (!catLabel) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: catLabel, image: catImage, id: catLabel })
      });
      if (res.ok) {
        setMsg({ text: "Kategori berhasil ditambahkan!", type: "success" });
        setCatLabel("");
        setCatImage("");
        fetchCategories();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(\`/api/categories/\${id}\`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ text: "Kategori berhasil dihapus!", type: "success" });
        fetchCategories();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddVideo = async (e: any) => {
    e.preventDefault();
    if (!videoUrl) return;
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", url: videoUrl })
      });
      if (res.ok) {
        setMsg({ text: "Video berhasil ditambahkan!", type: "success" });
        setVideoUrl("");
        fetchVideos();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(\`/api/media/\${id}\`, { method: "DELETE" });
      if (res.ok) {
        setMsg({ text: "Video berhasil dihapus!", type: "success" });
        fetchVideos();
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch(err) {
      console.error(err);
    }
  };

`;

if (!adminFile.includes('const [categories, setCategories] = useState')) {
  adminFile = adminFile.replace(
    'const fetchUsers = async () => {',
    fetchCode + '\n  const fetchUsers = async () => {'
  );
}

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
    '<span>Pengaturan Logo & Brand</span>',
    '<span>Pengaturan Logo & Brand</span>\n            </button>' + sidebarTabsCode
  );
}

const renderCategoriesTab = `
      ) : adminTab === "categories" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-serif text-2xl text-[#111111] mb-6">Kelola Kategori & Ikon</h2>
          <form onSubmit={handleAddCategory} className="space-y-4 max-w-xl mb-8">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Nama Kategori</label>
              <input type="text" required value={catLabel} onChange={e => setCatLabel(e.target.value)} className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Gambar Kategori / Ikon (URL atau Upload Base64)</label>
              <input type="text" value={catImage} onChange={e => setCatImage(e.target.value)} placeholder="https://..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer">Simpan Kategori Baru</button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((cat: any) => (
              <div key={cat.id} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden mb-3 border">
                  {cat.image ? <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">Sale</div>}
                </div>
                <div className="font-bold text-xs mb-3 text-center">{cat.label}</div>
                <button onClick={() => handleDeleteCategory(cat.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold w-full hover:bg-red-100 cursor-pointer">Hapus</button>
              </div>
            ))}
          </div>
        </div>
`;

const renderVideosTab = `
      ) : adminTab === "videos" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-serif text-2xl text-[#111111] mb-6">Video Produk Khusus</h2>
          <form onSubmit={handleAddVideo} className="space-y-4 max-w-xl mb-8">
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Video URL (Upload MP4 ke tempat lain, lalu paste linknya)</label>
              <input type="text" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer">Simpan Video</button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map((vid: any) => (
              <div key={vid.id} className="border border-slate-200 rounded-xl p-4">
                <video src={vid.url} controls className="w-full h-40 object-cover rounded-lg mb-3 bg-black" />
                <button onClick={() => handleDeleteVideo(vid.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold w-full hover:bg-red-100 cursor-pointer flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus</button>
              </div>
            ))}
          </div>
        </div>
`;

if (!adminFile.includes('adminTab === "categories"')) {
  adminFile = adminFile.replace(
    ') : adminTab === "customizations" ? (',
    renderCategoriesTab + renderVideosTab + '\n      ) : adminTab === "customizations" ? ('
  );
}

fs.writeFileSync('src/components/AdminPanel.tsx', adminFile);
console.log("Updated AdminPanel");
