import fs from 'fs';

let adminFile = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const uploadVideoCode = `
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Upload Video File (MP4, dll)</label>
              <input type="file" accept="video/*" onChange={async (e) => {
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
                          setVideoUrl(data.url);
                        }
                     } catch(e) {}
                  };
                  reader.readAsDataURL(file);
                }
              }} className="w-full text-xs mb-2" />
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Video URL (Otomatis terisi jika upload, atau paste linknya)</label>
              <input type="text" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
`;

adminFile = adminFile.replace(
  '<div>\n              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Video URL (Upload MP4 ke tempat lain, lalu paste linknya)</label>\n              <input type="text" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20" />\n            </div>',
  uploadVideoCode
);

fs.writeFileSync('src/components/AdminPanel.tsx', adminFile);
console.log("Fixed Video Upload");
