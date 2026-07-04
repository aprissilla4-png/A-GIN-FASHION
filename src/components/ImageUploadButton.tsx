import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadButtonProps {
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

export default function ImageUploadButton({ onUploadSuccess, currentUrl, label = "Pilih Gambar" }: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUrl is updated externally
  React.useEffect(() => {
    setPreviewUrl(null);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      console.log("Uploading file to server:", file.name);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data, name: file.name })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengunggah gambar ke server.");
      }

      const data = await res.json();
      console.log("Upload success, url:", data.url);
      onUploadSuccess(data.url);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("Gagal mengunggah: " + error.message);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {(previewUrl || currentUrl) && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
          <img src={previewUrl || currentUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              onUploadSuccess("");
            }}
            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 shadow-md transition-all scale-100 hover:scale-110 active:scale-95 cursor-pointer z-20 flex items-center justify-center border border-white"
            title="Hapus gambar"
          >
            <X className="w-3.5 h-3.5 pointer-events-none" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? "Mengunggah..." : label}
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
