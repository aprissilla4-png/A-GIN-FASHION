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
      alert("Gagal mengunggah video: " + error.message);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {(previewUrl || currentUrl) && (
        <div className="relative w-36 h-20 rounded-lg overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
          <video src={previewUrl || currentUrl} controls muted playsInline className="w-full h-full object-cover" />
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
      <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}
