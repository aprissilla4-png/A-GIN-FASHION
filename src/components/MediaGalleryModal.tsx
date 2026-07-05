import React, { useState, useEffect } from "react";
import { X, Loader2, Upload, Trash2, Check } from "lucide-react";
import { motion } from "motion/react";
import ImageUploadButton from "./ImageUploadButton";

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  createdAt: number;
}

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaGalleryModal({ isOpen, onClose, onSelect }: MediaGalleryModalProps) {
  if (!isOpen) return null;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        setMedia(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (url: string, type: "image" | "video") => {
    fetchMedia();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="p-4 border-b border-slate-150 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800">Pilih Media dari Galeri</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 h-[60vh] overflow-y-auto">
          {media.map((item) => (
            <div key={item.id} className="relative group border border-slate-200 rounded-lg overflow-hidden hover:border-red-500 transition-all h-32">
              <button
                onClick={() => { onSelect(item.url); onClose(); }}
                className="w-full h-full text-left focus:outline-none cursor-pointer"
              >
                {item.type === "image" ? (
                  <img src={item.url} alt="media" className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" />
                )}
              </button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
                    if (res.ok) {
                      fetchMedia();
                    } else {
                      const err = await res.json();
                      alert("Gagal menghapus: " + (err.error || "Unknown"));
                    }
                  } catch (err) {
                    console.error("Error deleting media:", err);
                    alert("Terjadi kesalahan saat menghapus media.");
                  }
                }}
                className="absolute top-1.5 right-1.5 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg opacity-100 transition-all flex items-center justify-center cursor-pointer z-20"
                title="Hapus Media dari Galeri"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          ))}
          {media.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 font-medium text-xs">
              Tidak ada media di galeri.
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-150">
           <ImageUploadButton label="Upload Media Baru" onUploadSuccess={(url) => handleUploadSuccess(url, "image")} />
        </div>
      </div>
    </div>
  );
}
