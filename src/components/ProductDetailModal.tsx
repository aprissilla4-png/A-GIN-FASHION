import React, { useState, useEffect } from "react";
import { 
  X, 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Heart, 
  Share2,
  Check,
  MessageCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { Product } from "../types";
import { motion } from "motion/react";

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
}

export default function ProductDetailModal({
  product,
  allProducts = [],
  onClose,
  onAddToCart
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Helper to parse string fields safely
  const parseSafeArray = (value: any, fallback: any[]): any[] => {
    if (!value) return fallback;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (e) {
        if (value.includes(",")) {
          return value.split(",").map((s: string) => s.trim());
        }
        return [value];
      }
    }
    return fallback;
  };

  // Set default states when a product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      const sizesArray = parseSafeArray(product.sizes, ["S", "M", "L", "XL"]);
      setSelectedSize(sizesArray[0] || "L");
      setIsLiked(false);
      setCopied(false);
    }
  }, [product]);

  if (!product) return null;

  // Gallery Logic
  const parsedImages = parseSafeArray(product.images, []);
  const availableImages = [product.image, ...parsedImages].filter(Boolean);

  const availableSizes = parseSafeArray(product.sizes, ["S", "M", "L", "XL"]);

  const discountPercentage = product.originalPrice
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % availableImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div 
      id="pdetail-page-overlay" 
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col"
    >
      {/* 1. Header Navigation Bar (Mimics brand new page header) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-emerald-950 transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-red-600" />
            <span className="hidden sm:inline">Kembali ke Katalog</span>
          </button>
          
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          
          {/* Breadcrumbs trail */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>Beranda</span>
            <span>/</span>
            <span className="capitalize">{product.category}</span>
            <span>/</span>
            <span className="text-slate-600 font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action triggers */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isLiked 
                ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
            }`}
            title="Sukai Produk"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-600" : ""}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer relative"
            title="Bagikan Tautan Produk"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            {copied && (
              <span className="absolute -bottom-10 right-0 bg-emerald-950 text-white text-[9px] px-2 py-1 rounded-md shadow font-bold whitespace-nowrap z-40">
                Tautan Disalin!
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-md shadow-red-100 flex items-center justify-center cursor-pointer"
            aria-label="Tutup halaman"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 2. Main Content Page Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left Column (Images/Carousel) - spans 6 cols */}
        <section className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* Main Slide view */}
          <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden aspect-square flex items-center justify-center shadow-md shadow-slate-100 group">
            
            <img
              src={availableImages[activeImageIndex]}
              alt={`${product.name} - Gambar ${activeImageIndex + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-300 transform hover:scale-[1.02]"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
              {discountPercentage > 0 && (
                <span className="bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider">
                  HEMAT {discountPercentage}%
                </span>
              )}
              {product.isFlashSale && (
                <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span>Kejar Diskon</span>
                </span>
              )}
            </div>

            {/* Slide Arrows (Only show if multiple images) */}
            {availableImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                  aria-label="Gambar sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
                  aria-label="Gambar berikutnya"
                >
                  <ChevronRight className="w-5 h-5 text-slate-800" />
                </button>
              </>
            )}

            {/* Slide Page Indicator bubble */}
            <div className="absolute bottom-4 right-4 bg-slate-900/70 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full backdrop-blur-xs tracking-wider">
              {activeImageIndex + 1} / {availableImages.length}
            </div>
          </div>

          {/* Thumbnails row / Collection Gallery */}
          {availableImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 px-0.5 no-scrollbar snap-x">
              {availableImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer snap-center ${
                    activeImageIndex === idx 
                      ? "border-red-600 scale-[1.03] shadow-md shadow-red-100" 
                      : "border-slate-100 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Interactive instruction hint */}
          <p className="text-center text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
            💡 Gunakan tombol panah di atas gambar untuk menggeser katalog foto model
          </p>
        </section>

        {/* Right Column (Product Details & Size Selection) - spans 6 cols */}
        <section className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Category tag */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-100/50">
                {product.category}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                Koleksi Spesial
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-black text-slate-800 text-xl md:text-2xl tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings & Social Counts */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2.5 py-1 rounded-lg font-extrabold border border-amber-100">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating || 4.8} / 5.0</span>
              </div>
              
              <span className="text-slate-400 font-semibold">•</span>
              
              <span className="text-slate-600 font-bold">
                Terjual <span className="text-emerald-950 font-black">{product.salesCount || 15}</span> pcs
              </span>
              
              <span className="text-slate-400 font-semibold">•</span>
              
              <span className="text-slate-600 font-bold">
                Sisa Stok: <span className={`font-black ${product.stock <= 5 ? "text-red-600" : "text-emerald-800"}`}>{product.stock} pcs</span>
              </span>
            </div>

            {/* Pricing Section */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Harga Spesial Toko</p>
              <div className="flex items-baseline gap-3.5">
                <span className="text-red-600 font-black text-2xl md:text-3xl tracking-tight">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
                {product.originalPrice && (
                  <span className="text-slate-400 line-through text-sm font-semibold">
                    Rp {product.originalPrice.toLocaleString("id-ID")}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-800 font-bold mt-1">✓ Garansi Produk Original & Bahan Standard Butik premium</p>
            </div>

            {/* SIZE / MODEL SELECTOR (Direct Request Requirement) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                  Pilih Ukuran Model <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-red-600 font-bold">Harap pilih sesuai badan Anda</span>
              </div>
              
              {/* Size Buttons Option */}
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      id={`pdetail-size-${size}`}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 h-12 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center border-2 transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/10"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-400 font-medium">Sistem kami akan menerapkan ukuran <span className="font-bold text-slate-600">"{selectedSize}"</span> ini di backend transaksi saat Anda memesan produk.</p>
            </div>

            <div className="h-px bg-slate-200 my-4" />

            {/* Description Paragraph */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Deskripsi Busana Lengkap</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-h-[150px] overflow-y-auto pr-1">
                {product.description}
              </p>
            </div>
          </div>

          {/* Guarantees & Call to Action Box */}
          <div className="space-y-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mt-4">
            
            {/* Trust Badges row */}
            <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-600 font-bold">
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <div>
                  <p className="text-slate-800 font-extrabold">Katun Premium</p>
                  <p className="text-[9px] text-slate-400">Dingin & Awet</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Truck className="w-4 h-4 text-emerald-800" />
                <div>
                  <p className="text-slate-800 font-extrabold">Bisa COD</p>
                  <p className="text-[9px] text-slate-400">Kirim Seluruh RI</p>
                </div>
              </div>
            </div>

            {/* CTA Main Button */}
            <button
              id={`pdetail-add-cta-large`}
              disabled={product.stock === 0}
              onClick={() => {
                onAddToCart(product, selectedSize);
              }}
              className={`w-full font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                product.stock === 0
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
              }`}
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span>
                {product.stock === 0 
                  ? "Stok Habis Terjual" 
                  : `Masukkan Ukuran (${selectedSize}) ke Keranjang Belanja`
                }
              </span>
            </button>
            
            <p className="text-[10px] text-slate-400 font-semibold text-center">
              ✓ Amankan barang Anda sekarang sebelum kehabisan stok!
            </p>
          </div>
        </section>
      </main>

      {/* 3. Small Bottom Section (Guarantees & customer note) */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 px-6 text-center text-xs text-slate-400 font-medium">
        <p>A-GIN FASHION - Tokopedia Premium Boutique. Pengiriman aman dengan kurir pilihan.</p>
      </footer>
    </motion.div>
  );
}
