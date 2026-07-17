import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  Image as ImageIcon, 
  AlertCircle, 
  ShoppingBag, 
  Trash2,
  FileText
} from "lucide-react";
import { Product, User } from "../types";

interface PostProductViewProps {
  onBackToHome: () => void;
  onProductAdded?: () => void;
  user?: User | null;
}

const PRESET_CATEGORIES = [
  "Kaos",
  "Oversize",
  "Streetwear",
  "Outerwear",
  "Bottoms",
  "Batik",
  "Women",
  "Promo",
  "Sablon DTF"
];

const PRESET_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

export default function PostProductView({ onBackToHome, onProductAdded, user }: PostProductViewProps) {
  // Form States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Kaos");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [stock, setStock] = useState("50");
  const [description, setDescription] = useState("");
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isPromo, setIsPromo] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successProduct, setSuccessProduct] = useState<Product | null>(null);

  // File Change Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    
    // Set immediate preview
    const localReader = new FileReader();
    localReader.onloadend = () => {
      setImagePreview(localReader.result as string);
    };
    localReader.readAsDataURL(file);

    // Auto Upload to backend
    const uploadReader = new FileReader();
    uploadReader.onloadend = async () => {
      setIsUploadingImage(true);
      setErrorMessage(null);
      try {
        const base64String = uploadReader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String, name: file.name })
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedImageUrl(data.url);
        } else {
          const errData = await res.json();
          setErrorMessage(errData.error || "Gagal mengunggah gambar ke server.");
        }
      } catch (err) {
        console.error("Upload error:", err);
        setErrorMessage("Koneksi gagal saat mengunggah gambar.");
      } finally {
        setIsUploadingImage(false);
      }
    };
    uploadReader.readAsDataURL(file);
  };

  // Drag and Drop Handlers
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Hanya file gambar yang didukung.");
      return;
    }

    setImageFile(file);
    const localReader = new FileReader();
    localReader.onloadend = () => {
      setImagePreview(localReader.result as string);
    };
    localReader.readAsDataURL(file);

    const uploadReader = new FileReader();
    uploadReader.onloadend = async () => {
      setIsUploadingImage(true);
      setErrorMessage(null);
      try {
        const base64String = uploadReader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String, name: file.name })
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedImageUrl(data.url);
        } else {
          const errData = await res.json();
          setErrorMessage(errData.error || "Gagal mengunggah gambar ke server.");
        }
      } catch (err) {
        console.error("Upload error:", err);
        setErrorMessage("Koneksi gagal saat mengunggah gambar.");
      } finally {
        setIsUploadingImage(false);
      }
    };
    uploadReader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl("");
  };

  // Toggle Size selection
  const handleToggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valdiation
    if (!name.trim()) {
      setErrorMessage("Nama produk tidak boleh kosong.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage("Harga produk harus lebih besar dari 0.");
      return;
    }
    if (originalPrice && Number(originalPrice) < Number(price)) {
      setErrorMessage("Harga asli coret harus lebih besar atau sama dengan harga jual.");
      return;
    }
    if (!stock || Number(stock) < 0) {
      setErrorMessage("Stok produk tidak boleh negatif.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Deskripsi produk wajib diisi.");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMessage("Kategori produk wajib ditentukan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: finalCategory,
      stock: Number(stock),
      description: description.trim(),
      image: uploadedImageUrl || imagePreview || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
      sizes: selectedSizes,
      isFlashSale,
      isPromo
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": user?.email || ""
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedProduct = await res.json();
        setSuccessProduct(savedProduct);
        if (onProductAdded) {
          onProductAdded();
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Gagal memposting produk ke database.");
      }
    } catch (err) {
      console.error("Post product error:", err);
      setErrorMessage("Koneksi gagal saat mencoba memposting produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear Form for another post
  const handlePostAnother = () => {
    setName("");
    setPrice("");
    setOriginalPrice("");
    setCategory("Kaos");
    setCustomCategory("");
    setIsCustomCategory(false);
    setStock("50");
    setDescription("");
    setIsFlashSale(false);
    setIsPromo(false);
    setSelectedSizes(["S", "M", "L", "XL"]);
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl("");
    setSuccessProduct(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full bg-white min-h-screen pt-4 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <button 
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Toko</span>
          </button>
          
          <div className="text-right">
            <span className="text-[10px] font-bold tracking-widest text-[#D46A7A] uppercase bg-[#D46A7A]/10 px-3 py-1 rounded-full">
              Fitur Premium
            </span>
          </div>
        </div>

        {/* Success Screen */}
        <AnimatePresence mode="wait">
          {successProduct ? (
            <motion.div 
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center max-w-2xl mx-auto my-8 shadow-sm"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-white">
                <CheckCircle className="w-9 h-9" />
              </div>
              
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                Produk Berhasil Diposting!
              </h2>
              <p className="text-emerald-700/85 text-sm max-w-md mx-auto mb-8">
                Produk <strong>{successProduct.name}</strong> telah berhasil ditambahkan ke katalog toko dan dapat langsung dibeli oleh pelanggan.
              </p>

              {/* Product Card Preview inside success */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 max-w-xs mx-auto mb-8 shadow-sm flex items-center gap-4 text-left">
                <img 
                  src={successProduct.image} 
                  alt={successProduct.name}
                  className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{successProduct.name}</h4>
                  <p className="text-xs text-[#D46A7A] font-semibold mt-0.5">
                    Rp {successProduct.price.toLocaleString("id-ID")}
                  </p>
                  <span className="inline-block bg-gray-100 text-[9px] font-bold uppercase tracking-wider text-gray-500 px-2 py-0.5 rounded-full mt-1">
                    {successProduct.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onBackToHome}
                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
                >
                  Lihat di Beranda
                </button>
                <button
                  onClick={handlePostAnother}
                  className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 bg-white transition-all"
                >
                  Posting Produk Baru Lagi
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                  <ShoppingBag className="w-8 h-8 text-[#D46A7A]" />
                  <span>Posting Produk Baru Anda</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                  Isi formulir berikut untuk mempublikasikan pakaian, merchandise, atau custom sablon premium Anda langsung ke pelanggan.
                </p>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Main form split */}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Upload & Preview */}
                <div className="md:col-span-5 space-y-6">
                  
                  {/* Image input Area */}
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Gambar Produk
                    </label>

                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-square bg-white border border-gray-100 shadow-sm group">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
                            <div className="w-8 h-8 border-3 border-t-[#D46A7A] border-gray-200 rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              Mengunggah...
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer bg-white relative ${
                          isDragOver 
                            ? "border-[#D46A7A] bg-[#D46A7A]/5" 
                            : "border-gray-200 hover:border-[#D46A7A]/50 hover:bg-gray-50/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-300 mb-3 border border-gray-100">
                          <Upload className="w-5 h-5 text-[#D46A7A]" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 mb-1">
                          Pilih File atau Seret ke Sini
                        </span>
                        <p className="text-[10px] text-gray-400 max-w-[200px]">
                          Format PNG, JPG, JPEG, atau WEBP dengan ukuran maks 5MB
                        </p>
                      </div>
                    )}

                    {uploadedImageUrl && (
                      <div className="mt-3 flex items-center gap-2 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gambar Berhasil Diproses</span>
                      </div>
                    )}
                  </div>

                  {/* Settings / Extra checks */}
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Promosi & Status
                    </label>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isFlashSale}
                          onChange={(e) => setIsFlashSale(e.target.checked)}
                          className="rounded text-[#D46A7A] focus:ring-[#D46A7A] w-4 h-4"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-gray-800 group-hover:text-[#D46A7A] transition-colors">
                            Jadikan Flash Sale
                          </span>
                          <p className="text-[10px] text-gray-400">
                            Produk akan masuk ke bagian Flash Sale berbatas waktu
                          </p>
                        </div>
                      </label>

                      <hr className="border-gray-200/60 my-1" />

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isPromo}
                          onChange={(e) => setIsPromo(e.target.checked)}
                          className="rounded text-[#D46A7A] focus:ring-[#D46A7A] w-4 h-4"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-gray-800 group-hover:text-[#D46A7A] transition-colors">
                            Tandai Sebagai Promo
                          </span>
                          <p className="text-[10px] text-gray-400">
                            Menambahkan lencana & badge Promo Spesial di katalog
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right side: Input fields */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* Basic Info */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 shadow-sm">
                    
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Nama Produk <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Kaos Polos Vintage Oversize A-GIN"
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans"
                      />
                    </div>

                    {/* Price grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Sale Price */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Harga Jual (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Contoh: 75000"
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans font-semibold"
                        />
                      </div>

                      {/* Original Price */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Harga Coret / Asli (Rp)
                        </label>
                        <input
                          type="number"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          placeholder="Contoh: 120000"
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans text-gray-500"
                        />
                      </div>

                    </div>

                    {/* Category Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Kategori Produk <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(!isCustomCategory);
                            setCustomCategory("");
                          }}
                          className="text-[10px] font-bold text-[#D46A7A] uppercase tracking-wider hover:underline"
                        >
                          {isCustomCategory ? "Pilih Preset Kategori" : "+ Tulis Kategori Kustom"}
                        </button>
                      </div>

                      {isCustomCategory ? (
                        <input
                          type="text"
                          required
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Tulis kategori baru, misal: Hoodie, Jersey, Celana..."
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans"
                        />
                      ) : (
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans cursor-pointer appearance-none"
                        >
                          {PRESET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Stock & Sizes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Stock */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Stok Awal <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Contoh: 100"
                          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans"
                        />
                      </div>

                      {/* Sizes selection */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Ukuran Tersedia
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_SIZES.map((size) => {
                            const isSelected = selectedSizes.includes(size);
                            return (
                              <button
                                type="button"
                                key={size}
                                onClick={() => handleToggleSize(size)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  isSelected 
                                    ? "bg-gray-950 text-white border-gray-950" 
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Deskripsi Produk <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        placeholder="Tuliskan spesifikasi produk, bahan pakaian, ukuran detail, dan instruksi cuci..."
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#D46A7A] focus:bg-white transition-all font-sans resize-none"
                      />
                    </div>

                  </div>

                  {/* Submission triggers */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="px-6 py-4 bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gray-200 hover:text-gray-950 transition-all cursor-pointer flex-shrink-0"
                    >
                      Batal
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingImage}
                      className="flex-1 px-8 py-4 bg-[#D46A7A] text-white font-extrabold uppercase tracking-widest text-xs rounded-full hover:bg-[#C55263] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                          <span>Mempublikasikan...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Posting Produk Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
