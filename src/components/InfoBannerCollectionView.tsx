import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Sparkles, Plus, Tag, ShoppingBag, Eye, X, Image as ImageIcon, CheckCircle, AlertCircle, Trash2, Sliders } from "lucide-react";
import { Product, InfoBanner, User } from "../types";
import ImageUploadButton from "./ImageUploadButton";

interface InfoBannerCollectionViewProps {
  banner: InfoBanner;
  products: Product[];
  onAddToCart: (product: Product, quantity: number, size: string) => void;
  onBack: () => void;
  user: User | null;
  onReloadProducts: () => void;
  onViewDetail: (product: Product) => void;
}

export default function InfoBannerCollectionView({
  banner,
  products,
  onAddToCart,
  onBack,
  user,
  onReloadProducts,
  onViewDetail
}: InfoBannerCollectionViewProps) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(user?.isAdmin || false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New product form states
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pOriginalPrice, setPOriginalPrice] = useState("");
  const [pImage, setPImage] = useState("");
  const [pStock, setPStock] = useState("100");
  const [pDescription, setPDescription] = useState("");

  // Determine the category name to display (from hashtag in buttonUrl or default to banner title)
  const displayCategory = banner.buttonUrl && banner.buttonUrl.startsWith("#")
    ? banner.buttonUrl.substring(1).trim()
    : banner.title;

  const collectionCategory = displayCategory || "Koleksi Khusus";

  // Filter products that belong to this banner specifically via collectionId, 
  // or fallback to category matching for backward compatibility
  const filteredProducts = products.filter(
    (p) => 
      (p.collectionId === banner.id) || 
      (!p.collectionId && p.category.toLowerCase().trim() === collectionCategory.toLowerCase().trim())
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPrice || !pDescription) {
      setErrorMsg("Nama, harga, dan deskripsi produk wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const productPayload = {
      name: pName,
      price: Number(pPrice),
      originalPrice: pOriginalPrice ? Number(pOriginalPrice) : undefined,
      image: pImage || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
      category: collectionCategory,
      collectionId: banner.id,
      stock: Number(pStock),
      description: pDescription,
      sizes: ["S", "M", "L", "XL"],
      isFlashSale: false,
      isPromo: false,
      isBannerProduct: true
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Email": user?.email || ""
        },
        body: JSON.stringify(productPayload)
      });

      if (res.ok) {
        setSuccessMsg(`Produk "${pName}" berhasil diunggah ke koleksi ini!`);
        // Clear form
        setPName("");
        setPPrice("");
        setPOriginalPrice("");
        setPImage("");
        setPStock("100");
        setPDescription("");
        
        // Reload products in the parent
        onReloadProducts();
        
        // Hide success message after a delay
        setTimeout(() => {
          setSuccessMsg("");
        }, 3000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Gagal mengunggah produk.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productName}" dari koleksi ini?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Email": user?.email || ""
        }
      });
      if (res.ok) {
        setSuccessMsg(`Produk "${productName}" berhasil dihapus.`);
        onReloadProducts();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg("Gagal menghapus produk.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 pb-20">
      {/* Back Button and Navigation Bar */}
      <div className="max-w-[1400px] mx-auto px-[4vw] py-6 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1B1B1B]/80 hover:text-black transition-all hover:-translate-x-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Toko</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Mode Koleksi
          </span>
          {user?.isAdmin && (
            <button
              onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm border ${
                isAdminPanelOpen 
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" 
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isAdminPanelOpen ? "Sembunyikan Panel Upload" : "Tampilkan Panel Upload"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Majestic Cover Hero Banner (Enlarged like Banner No. 1 / Nike-style) */}
      <div 
        className="relative w-full h-[60vh] md:h-[70vh] min-h-[400px] md:min-h-[500px] overflow-hidden flex items-center justify-center text-center"
        style={{ backgroundColor: banner.bgColor || "#111" }}
      >
        {/* Full Screen Image with high quality */}
        {banner.image ? (
          <div className="absolute inset-0">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1540759786422-c60d5ed57d7b?auto=format&fit=crop&q=80&w=1400";
              }}
            />
            {/* Elegant vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1B1B1B] via-gray-950 to-black flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#333_25%,transparent_25%),linear-gradient(-45deg,#333_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#333_75%),linear-gradient(-45deg,transparent_75%,#333_75%)] bg-[size:24px_24px]" />
          </div>
        )}

        {/* Floating Typography Overlay */}
        <div className="relative z-10 max-w-4xl px-6 space-y-6 text-white">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-white border border-white/20 bg-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>KOLEKSI AKTIF</span>
          </span>

          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-none drop-shadow-md"
            style={{ color: banner.textColor || "#ffffff" }}
          >
            {banner.title}
          </h1>

          {banner.subtitle && (
            <p 
              className="text-xs sm:text-sm md:text-base font-semibold max-w-2xl mx-auto leading-relaxed opacity-90 drop-shadow-sm font-sans"
              style={{ color: banner.textColor ? `${banner.textColor}ee` : "#ffffff" }}
            >
              {banner.subtitle}
            </p>
          )}

          <div className="pt-2 font-mono text-[10px] uppercase tracking-widest text-white/75 font-bold flex items-center justify-center gap-2">
            <span>Koleksi Utama:</span>
            <span className="bg-yellow-400 text-black px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider">{collectionCategory}</span>
            <span>•</span>
            <span>{filteredProducts.length} Produk Tersedia</span>
          </div>
        </div>
      </div>

      {/* Main Body Grid (Dual Column on Desktop when Admin is Active) */}
      <div className="max-w-[1400px] mx-auto px-[4vw] py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* SPECIALIZED INLINE ADMIN PANEL FOR UPLOADING PRODUCTS (Right-side/Top relative to catalog) */}
          {user?.isAdmin && isAdminPanelOpen && (
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-sm sticky top-6 z-30 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Panel Admin Upload</span>
                  </h3>
                  <button 
                    onClick={() => setIsAdminPanelOpen(false)}
                    className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider leading-relaxed">
                  Semua produk di form ini otomatis didefinisikan ke koleksi: <span className="text-emerald-700 font-extrabold underline">{collectionCategory}</span>
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold leading-relaxed border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold leading-relaxed border border-green-100 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner"
                    placeholder="Contoh: Kaos Oversize Nike Air"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                      Harga Jual (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner"
                      placeholder="Contoh: 149000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                      Harga Coret (Rp)
                    </label>
                    <input
                      type="number"
                      value={pOriginalPrice}
                      onChange={(e) => setPOriginalPrice(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner"
                      placeholder="Contoh: 299000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                      Kuantitas Stok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                      Kategori (Terkunci)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={collectionCategory}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-200 font-extrabold text-slate-600 cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                    Upload Gambar Produk <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pImage}
                      onChange={(e) => setPImage(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner flex-1"
                      placeholder="URL Gambar / Pilih Unggah..."
                    />
                    <ImageUploadButton 
                      label="Upload"
                      currentUrl={pImage}
                      onUploadSuccess={(url) => setPImage(url)}
                    />
                  </div>
                  {pImage && (
                    <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white flex items-center justify-center p-1">
                      <img src={pImage} className="w-full h-full object-contain rounded-lg" alt="Preview" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                    Deskripsi Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium bg-white transition-all shadow-inner"
                    placeholder="Bahan pakaian, kecocokan sablon, detail ukuran..."
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#1B1B1B] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-yellow-300 animate-pulse" />
                      <span>Unggah Produk Baru</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* CATALOG / PRODUCT GRID - Takes up remaining columns */}
          <div className={`${user?.isAdmin && isAdminPanelOpen ? "lg:col-span-8" : "lg:col-span-12"} space-y-10`}>
            
            {/* Catalog items container */}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
                {filteredProducts.map((p) => {
                  const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                  const discountPercentage = hasDiscount 
                    ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group relative flex flex-col h-full cursor-pointer bg-transparent"
                      onClick={() => onViewDetail(p)}
                    >
                      {/* Image wrapper - NIKE STYLING: Clean, generous space, borderless looks */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-transparent rounded-2xl flex items-center justify-center p-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain select-none transition-transform duration-700 ease-out group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />

                        {/* Promo / Discount Badge */}
                        {hasDiscount && (
                          <span className="absolute top-3 left-3 bg-red-600 text-white font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm z-10">
                            -{discountPercentage}% OFF
                          </span>
                        )}

                        {/* Admin Action Overlay */}
                        {user?.isAdmin && (
                          <div className="absolute top-3 right-3 z-20 flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(p.id, p.name);
                              }}
                              className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-sm border border-slate-100 transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-5 py-2.5 rounded-full bg-[#1B1B1B] text-white font-black text-[9px] tracking-widest uppercase shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka Detail</span>
                          </span>
                        </div>
                      </div>

                      {/* Product details - Nike-style layout */}
                      <div className="mt-4 flex flex-col flex-grow space-y-1">
                        <span className="font-mono text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                          {p.category}
                        </span>
                        
                        <h3 className="font-sans font-black text-slate-900 text-sm leading-tight tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        
                        <p className="text-slate-500 text-xs font-semibold line-clamp-1 leading-relaxed flex-grow">
                          {p.description}
                        </p>
                        
                        <div className="pt-2 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-[#1B1B1B] tracking-tight">{formatRupiah(p.price)}</span>
                            {hasDiscount && (
                              <span className="block text-[10px] text-gray-400 line-through font-extrabold">
                                {formatRupiah(p.originalPrice!)}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const defaultSize = p.sizes && p.sizes.length > 0 ? p.sizes[0] : "S";
                              onAddToCart(p, 1, defaultSize);
                            }}
                            className="w-8 h-8 rounded-full bg-[#1B1B1B] text-white hover:bg-black flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-slate-200 rounded-[2.5rem] max-w-xl mx-auto space-y-5 bg-slate-50/50">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                  <ShoppingBag className="w-6 h-6 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <p className="font-sans font-black text-xs text-[#1B1B1B] uppercase tracking-widest">Koleksi Masih Kosong</p>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-8">
                    Belum ada produk yang diunggah untuk kategori <span className="text-slate-800 font-extrabold">"{collectionCategory}"</span>. 
                    {user?.isAdmin ? (
                      <span className="block mt-1 text-emerald-700">Silakan gunakan Panel Upload Admin di sebelah kiri untuk mengunggah produk pertama Anda sekarang!</span>
                    ) : (
                      " Silakan nantikan rilis produk terbaru kami dalam waktu dekat."
                    )}
                  </p>
                </div>
                {user?.isAdmin && !isAdminPanelOpen && (
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1B1B1B] hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Aktifkan Panel Upload & Posting</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
