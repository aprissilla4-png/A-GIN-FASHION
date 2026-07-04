import fs from 'fs';

let adminFile = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const uploadCatCode = `
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Gambar Kategori / Ikon (Upload Gambar)</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                if(e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                     try {
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ image: reader.result, name: file.name })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setCatImage(data.url);
                        }
                     } catch(e) {}
                  };
                  reader.readAsDataURL(file);
                }
              }} className="w-full text-xs mb-2" />
              <input type="text" value={catImage} onChange={e => setCatImage(e.target.value)} placeholder="URL Gambar..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
`;

adminFile = adminFile.replace(
  '<div>\n              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Gambar Kategori / Ikon (URL atau Upload Base64)</label>\n              <input type="text" value={catImage} onChange={e => setCatImage(e.target.value)} placeholder="https://..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />\n            </div>',
  uploadCatCode
);

fs.writeFileSync('src/components/AdminPanel.tsx', adminFile);
console.log("Fixed Category Upload");
