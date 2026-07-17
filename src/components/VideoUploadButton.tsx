import React, { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";

interface VideoUploadButtonProps {
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

export default function VideoUploadButton({ onUploadSuccess, currentUrl, label = "Pilih Video" }: VideoUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    
    
    // Limit to 1GB as requested
    if (file.size > 1024 * 1024 * 1024) {
      alert("Ukuran video terlalu besar. Maksimal 1GB sesuai permintaan. Mohon pastikan perangkat Anda memiliki RAM yang cukup untuk memproses file ini.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      console.log("Uploading video file to server:", file.name);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, name: file.name })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengunggah video ke server.");
      }

      const data = await res.json();
      console.log("Video upload success, url:", data.url);
      onUploadSuccess(data.url);
    } catch (error: any) {
      console.error("Error uploading video:", error);
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        alert("Gagal mengunggah video: Ukuran file mungkin terlalu besar untuk server. Silakan masukkan URL video secara manual.");
      } else {
        alert("Gagal mengunggah video: " + error.message);
      }
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUploadSuccess(e.target.value);
  };

  return (
    <div className="space-y-3">
      {(previewUrl || currentUrl) && (
        <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center shadow-inner">
          <video key={previewUrl || currentUrl} src={previewUrl || currentUrl} controls muted playsInline className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Atau Masukkan URL Video (YouTube/Link Langsung)</label>
        <input 
          type="text" 
          placeholder="https://..." 
          value={currentUrl || ""} 
          onChange={handleUrlChange}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
        />
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-xs font-black uppercase bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Sedang Mengunggah..." : label}
      </button>
      <p className="text-[10px] text-slate-500 italic">Maksimal 1GB. Video akan otomatis diredam (muted) untuk mendukung putar otomatis.</p>
      <input type="file" accept="video/mp4,video/quicktime" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
