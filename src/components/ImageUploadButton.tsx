import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadButtonProps {
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  label?: string;
  isLogo?: boolean;
  removeBg?: boolean;
  bgType?: "white" | "black" | "white_to_dark" | "black_to_dark" | "none";
  cropBottom?: boolean;
  multiple?: boolean;
}

export default function ImageUploadButton({ 
  onUploadSuccess, 
  currentUrl, 
  label = "Pilih Gambar",
  isLogo = false,
  removeBg = false,
  bgType = "none",
  cropBottom = false,
  multiple = false
}: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUrl is updated externally
  React.useEffect(() => {
    setPreviewUrl(null);
  }, [currentUrl]);

  const uploadFile = async (file: File) => {
    // Resize image on client side before uploading to prevent payload too large errors
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            
            if (isLogo || file.type === "image/png") {
              resolve(canvas.toDataURL("image/png"));
            } else {
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            }
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    console.log("Uploading file to server:", file.name);
    
    const uploadUrl = isLogo ? "/api/upload-logo" : "/api/upload";
    const payload: any = { image: base64Data, name: file.name };
    
    if (isLogo) {
        payload.removeBg = removeBg;
        payload.bgType = bgType;
        payload.cropBottom = cropBottom;
    }

    const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengunggah gambar ke server.");
    }

    const data = await res.json();
    console.log("Upload success, url:", data.url);
    return data.url;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      if (!multiple) {
          const file = files[0];
          setPreviewUrl(URL.createObjectURL(file));
          const url = await uploadFile(file);
          onUploadSuccess(url);
      } else {
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const url = await uploadFile(file);
              onUploadSuccess(url);
          }
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("Gagal mengunggah: " + error.message);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      {!multiple && (previewUrl || currentUrl) && (
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
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} multiple={multiple} className="hidden" />
    </div>
  );
}

