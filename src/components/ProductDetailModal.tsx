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
  Sparkles,
  CreditCard,
  Phone,
  Camera,
  CheckCircle,
  Search,
  Package
} from "lucide-react";
import { Product, LogoSettings } from "../types";
import { motion } from "motion/react";

import { BrandLogo } from './BrandLogo';
import MapAddressPicker from "./MapAddressPicker";

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
  logoSettings?: LogoSettings;
}

export default function ProductDetailModal({
  product,
  allProducts = [],
  onClose,
  onAddToCart,
  logoSettings
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'detail' | 'reviews' | 'checkout' | 'tracking'>('detail');

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCourier, setCheckoutCourier] = useState("jne");
  const [shippingCost, setShippingCost] = useState(12000); // default JNE Jabodetabek
  const [shippingEtd, setShippingEtd] = useState("1-2 Hari Kerja");
  const [shippingService, setShippingService] = useState("REG (Reguler)");
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("DOKU");
  const [chargingPayment, setChargingPayment] = useState(false);
  
  // Payment result state
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Tracking state
  const [trackingWaybill, setTrackingWaybill] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<any | null>(null);
  const [searchingTracking, setSearchingTracking] = useState(false);

  const getCourierDisplayName = (code: string) => {
    const names: Record<string, string> = {
      gojek: "Gojek (Instant / Same Day)",
      grab: "Grab (Instant / Same Day)",
      lalamove: "Lalamove (Instant / Same Day)",
      jne: "JNE Express",
      jnt: "J&T Express",
      sicepat: "SiCepat Ekspres",
      idexpress: "IDExpress",
      ninja: "Ninja Xpress",
      pos: "Pos Indonesia",
      anteraja: "Anteraja",
      tiki: "TIKI",
      jnt_cargo: "J&T Cargo"
    };
    return names[code.toLowerCase()] || code;
  };

  const getWhatsAppLink = (number: string) => {
    if (!product) return "";
    const cleanNumber = number.replace(/^0/, "62");
    const text = `Halo Admin Tokopedia Fashion, saya ingin memesan busana berikut:%0A%0A*Produk:* ${product.name}%0A*Ukuran:* ${selectedSize}%0A*Harga:* Rp ${product.price.toLocaleString("id-ID")}%0A%0AApakah stoknya masih tersedia untuk segera dikirim? Terima kasih!`;
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  const fetchReviews = async () => {
    if (!product) return;
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Gagal mengambil review:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // Reset checkout and tracking states
    setShowCheckout(false);
    setActiveOrder(null);
    setTrackingInfo(null);
    setTrackingWaybill("");
    setActiveDetailTab("detail");
  }, [product]);

  const handleReviewImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadingImage(true);
      try {
        const base64String = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String, name: file.name })
        });
        if (res.ok) {
          const data = await res.json();
          setReviewImage(data.url);
        }
      } catch (err) {
        console.error("Gagal mengupload gambar bukti:", err);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim() || !product) return;

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reviewName,
          comment: reviewComment,
          rating: reviewRating,
          imageProofUrl: reviewImage || ""
        })
      });

      if (res.ok) {
        setReviewSuccess(true);
        setReviewName("");
        setReviewComment("");
        setReviewRating(5);
        setReviewImage(null);
        fetchReviews();
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Gagal mengirim ulasan:", err);
    }
  };

  const calculateShippingCost = async () => {
    if (!checkoutAddress.trim()) return;
    setCalculatingShipping(true);
    setShippingError(null);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: checkoutAddress,
          courier: checkoutCourier,
          weight: 1
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShippingCost(data.cost);
        setShippingEtd(data.etd);
        setShippingService(data.service);
        setShippingError(null);
      } else {
        setShippingError(data.error || "Gagal menghitung ongkos kirim.");
        setShippingCost(0);
        setShippingEtd("Tidak Tersedia");
        setShippingService("None");
      }
    } catch (err: any) {
      console.error("Gagal menghitung ongkos kirim:", err);
      setShippingError(err.message || "Gagal menghubungi server pengiriman.");
      setShippingCost(0);
    } finally {
      setCalculatingShipping(false);
    }
  };

  useEffect(() => {
    if (checkoutAddress.trim() && (showCheckout || activeDetailTab === "checkout")) {
      const delayDebounceFn = setTimeout(() => {
        calculateShippingCost();
      }, 600);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [checkoutAddress, checkoutCourier, activeDetailTab, showCheckout]);

  const handleCreateOrder = async () => {
    if (!product || !checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
      alert("Harap lengkapi semua data pengiriman Anda.");
      return;
    }
    setChargingPayment(true);
    try {
      const totalAmount = product.price + shippingCost + 2000;
      const res = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          size: selectedSize,
          price: product.price,
          quantity: 1,
          customerName: checkoutName,
          customerPhone: checkoutPhone,
          address: checkoutAddress,
          courier: checkoutCourier,
          shippingCost: shippingCost,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setActiveOrder(orderData);
        setPaymentStatus("pending");
      }
    } catch (err) {
      console.error("Gagal memproses pembayaran:", err);
    } finally {
      setChargingPayment(false);
    }
  };

  const handleCheckPaymentStatus = async (simulateSuccess: boolean = false) => {
    if (!activeOrder) return;
    setCheckingStatus(true);
    try {
      const url = `/api/payments/status/${activeOrder.orderId}${simulateSuccess ? "?simulatePayment=success" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data.status);
      }
    } catch (err) {
      console.error("Gagal memperbarui status pembayaran:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleTrackPackage = async (waybillCode?: string) => {
    const code = waybillCode || trackingWaybill;
    if (!code.trim()) return;
    setSearchingTracking(true);
    try {
      const res = await fetch(`/api/shipping/track/${code}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingInfo(data);
      }
    } catch (err) {
      console.error("Gagal melacak resi:", err);
    } finally {
      setSearchingTracking(false);
    }
  };

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
      className="fixed inset-0 bg-slate-50 z-[70] overflow-y-auto flex flex-col"
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
            <h1 className="font-black text-slate-800 text-2xl md:text-3xl tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings & Social Counts */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
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
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">Harga Spesial Toko</p>
              <div className="flex items-baseline gap-3.5">
                <span className="text-red-600 font-black text-3xl md:text-4xl tracking-tight">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
                {product.originalPrice && (
                  <span className="text-slate-400 line-through text-sm font-semibold">
                    Rp {product.originalPrice.toLocaleString("id-ID")}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-emerald-800 font-bold mt-1">✓ Garansi Produk Original & Bahan Standard Butik premium</p>
            </div>

            {/* INTERACTIVE NAVIGATION TABS */}
            <div className="flex border-b border-slate-200 mt-6 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveDetailTab('detail')}
                className={`flex-1 pb-3 text-center text-xs font-black tracking-wider uppercase transition-all border-b-2 cursor-pointer px-4 ${
                  activeDetailTab === 'detail'
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Detail & Order
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('reviews')}
                className={`flex-1 pb-3 text-center text-xs font-black tracking-wider uppercase transition-all border-b-2 cursor-pointer px-4 ${
                  activeDetailTab === 'reviews'
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Ulasan ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('checkout')}
                className={`flex-1 pb-3 text-center text-xs font-black tracking-wider uppercase transition-all border-b-2 cursor-pointer px-4 ${
                  activeDetailTab === 'checkout'
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Checkout Instan
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('tracking')}
                className={`flex-1 pb-3 text-center text-xs font-black tracking-wider uppercase transition-all border-b-2 cursor-pointer px-4 ${
                  activeDetailTab === 'tracking'
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Lacak Resi
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-4 pt-1">
              {activeDetailTab === 'detail' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* SIZE / MODEL SELECTOR */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                        Pilih Ukuran Model <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-red-600 font-bold">Sesuaikan dengan ukuran badan Anda</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => {
                        const isActive = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            id={`pdetail-size-${size}`}
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-11 h-11 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center border-2 transition-all cursor-pointer active:scale-95 ${
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
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  {/* Description Paragraph */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Deskripsi Lengkap</h4>
                    <p className="text-sm text-slate-600 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                      {product.description}
                    </p>
                  </div>

                  {/* Guarantees & Call to Action Box */}
                  <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    {/* Trust Badges row */}
                    <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 font-bold">
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <div>
                          <p className="text-slate-800 font-extrabold text-[11px]">Katun Premium</p>
                          <p className="text-[10px] text-slate-400">Standard Butik</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Truck className="w-4 h-4 text-emerald-700" />
                        <div>
                          <p className="text-slate-800 font-extrabold text-[11px]">Bisa COD</p>
                          <p className="text-[10px] text-slate-400">Seluruh Indonesia</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA Main Button */}
                    <button
                      type="button"
                      id={`pdetail-add-cta-large`}
                      disabled={product.stock === 0}
                      onClick={() => {
                        onAddToCart(product, selectedSize);
                      }}
                      className={`w-full font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                        product.stock === 0
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/10"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {product.stock === 0 
                          ? "Stok Habis" 
                          : `Tambahkan Ukuran (${selectedSize}) ke Keranjang`
                        }
                      </span>
                    </button>

                    {/* WhatsApp Quick Order Block */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 text-center">Pemesanan Langsung Via WhatsApp</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={getWhatsAppLink("081219154973")}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2.5 px-2 rounded-xl transition-all text-center shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Admin 1 (0812)</span>
                        </a>
                        <a
                          href={getWhatsAppLink("085774712676")}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black py-2.5 px-2 rounded-xl transition-all text-center shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Admin 2 (0857)</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'reviews' && (
                <div className="space-y-5 animate-fadeIn max-h-[500px] overflow-y-auto pr-1">
                  {/* Write Review Form */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">Tulis Ulasan & Rating Produk</h4>
                    
                    {reviewSuccess ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Ulasan Anda berhasil dikirim! Rating produk diperbarui.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Anda</label>
                            <input
                              type="text"
                              required
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              placeholder="Contoh: Aprhyzsilla"
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Berikan Rating</label>
                            <div className="flex gap-1 items-center h-8">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="text-amber-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Star className={`w-5 h-5 ${reviewRating >= star ? "fill-amber-400" : "text-slate-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tulis Komentar / Review</label>
                          <textarea
                            required
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Tulis pendapat Anda tentang kualitas kain, jahitan, atau ukuran..."
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-red-500 resize-none"
                          />
                        </div>

                        {/* Photo Proof Upload */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Upload Foto Bukti Fisik</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-xs transition-all">
                              <Camera className="w-3.5 h-3.5 text-slate-500" />
                              <span>Pilih Foto</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleReviewImageChange}
                                className="hidden"
                              />
                            </label>
                            
                            {uploadingImage && (
                              <span className="text-[10px] text-slate-400 font-bold animate-pulse">Mengupload foto...</span>
                            )}

                            {reviewImage && !uploadingImage && (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-300">
                                <img src={reviewImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setReviewImage(null)}
                                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={uploadingImage}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Kirim Ulasan & Rating
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Semua Ulasan Pembeli</h4>
                    {loadingReviews ? (
                      <p className="text-xs text-slate-400 text-center py-4">Memuat ulasan produk...</p>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400 font-medium">Belum ada ulasan untuk pakaian ini.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Beli sekarang dan jadilah pembeli pertama yang memberikan review!</p>
                      </div>
                    ) : (
                      reviews.map((rev: any) => (
                        <div key={rev.id} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{rev.name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                          </div>
                          
                          <div className="flex gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${rev.rating >= s ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>

                          <p className="text-slate-600 leading-relaxed font-medium">{rev.comment}</p>

                          {rev.imageProofUrl && (
                            <div className="mt-2.5">
                              <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Foto Bukti Pembeli</span>
                              </p>
                              <img
                                src={rev.imageProofUrl}
                                alt="Foto ulasan pembeli"
                                referrerPolicy="no-referrer"
                                className="w-24 h-24 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-all"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'checkout' && (
                <div className="space-y-4 animate-fadeIn">
                  {activeOrder ? (
                    /* Order Successful Panel */
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="text-center space-y-1">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Pesanan Berhasil Dibuat!</h4>
                        <p className="text-[11px] text-slate-400">Silakan selesaikan pembayaran agar pesanan segera diproses.</p>
                      </div>

                      <div className="border-t border-b border-slate-100 py-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">ID Transaksi</span>
                          <span className="font-bold text-slate-700 font-mono text-[10px]">{activeOrder.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Produk</span>
                          <span className="font-bold text-slate-700 max-w-[150px] truncate">{product.name} ({selectedSize})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">Metode</span>
                          {activeOrder.paymentMethod === "DOKU_CHECKOUT" || activeOrder.paymentMethod === "DOKU" ? (
                            <BrandLogo brand="DOKU" className="h-4 w-auto" />
                          ) : activeOrder.paymentMethod === "MIDTRANS_SNAP" || activeOrder.paymentMethod === "MIDTRANS" ? (
                            <BrandLogo brand="MIDTRANS" className="h-4 w-auto" />
                          ) : (
                            <span className="font-bold text-red-600">{activeOrder.paymentMethod.replace("VA_", "Transfer VA ")}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium">Kurir Pengiriman</span>
                          <div className="flex items-center gap-2">
                            <BrandLogo brand={activeOrder.courier} className="h-4 w-auto max-w-[60px] object-contain" />
                            <span className="font-bold text-slate-700">({activeOrder.waybill || "Belum Tersedia"})</span>
                          </div>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-50">
                          <span className="text-slate-500 font-bold">Total Pembayaran</span>
                          <span className="font-black text-red-600 text-sm">Rp {activeOrder.totalAmount.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      {/* QRIS / VA Display or Hosted Checkout URL */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
                        {activeOrder.checkoutUrl ? (
                          <div className="space-y-3">
                            <div className="flex justify-center items-center gap-2">
                              <BrandLogo brand={activeOrder.paymentMethod?.includes("MIDTRANS") ? "MIDTRANS" : "DOKU"} className="h-4 w-auto grayscale-0" />
                              <span className="text-[11px] font-black text-slate-700 tracking-wide uppercase">PAYMENT GATEWAY</span>
                            </div>
                            <a
                              href={activeOrder.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex justify-center items-center gap-1.5 bg-white text-red-600 border-2 border-red-600 hover:bg-slate-50 font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                            >
                              Bayar dengan <BrandLogo brand={activeOrder.paymentMethod?.includes("MIDTRANS") ? "MIDTRANS" : "DOKU"} className="h-3.5 w-auto" /> &rarr;
                            </a>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                              {activeOrder.instructions}
                            </p>
                          </div>
                        ) : activeOrder.qrCodeUrl ? (
                          <div className="space-y-2.5">
                            <p className="text-[11px] font-black text-slate-700 tracking-wide">KODE QRIS BOUTIQUE A-GIN</p>
                            <div className="bg-white p-2 inline-block rounded-xl border border-slate-200 shadow-xs">
                              <img
                                src={activeOrder.qrCodeUrl}
                                alt="QRIS Code"
                                referrerPolicy="no-referrer"
                                className="w-40 h-40 mx-auto"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                              {activeOrder.instructions}
                            </p>
                          </div>
                        ) : activeOrder.vaNumber ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 tracking-wide uppercase">NOMOR VIRTUAL ACCOUNT</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg font-black text-slate-800 font-mono tracking-wider bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                {activeOrder.vaNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeOrder.vaNumber);
                                  alert("Nomor Virtual Account disalin ke clipboard!");
                                }}
                                className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded-md hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
                              >
                                SALIN
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto pt-1">
                              {activeOrder.instructions}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Payment Status Check Section */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center space-y-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status Pembayaran:</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            paymentStatus === "settlement" 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                              : "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                          }`}>
                            {paymentStatus === "settlement" ? "✓ BERHASIL / PAID" : "PENDING"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleCheckPaymentStatus(false)}
                            disabled={checkingStatus}
                            className={`bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2.5 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                              activeOrder?.isRealMidtrans ? "col-span-2" : ""
                            }`}
                          >
                            {checkingStatus ? "Memeriksa..." : "Perbarui Status"}
                          </button>
                          
                          {!activeOrder?.isRealMidtrans && (
                            <button
                              type="button"
                              onClick={() => handleCheckPaymentStatus(true)}
                              disabled={checkingStatus || paymentStatus === "settlement"}
                              className="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-[10px] font-black py-2.5 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {paymentStatus === "settlement" ? "Terbayar!" : "Simulasikan Bayar"}
                            </button>
                          )}
                        </div>
                        
                        {activeOrder?.isRealMidtrans ? (
                          <div className="space-y-1">
                            <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1">
                              ⚡ KONEKSI <BrandLogo brand={activeOrder?.paymentMethod?.includes("MIDTRANS") ? "MIDTRANS" : "DOKU"} className="h-2.5 w-auto" /> REAL-TIME AKTIF
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                              Silakan selesaikan pembayaran Anda di halaman payment gateway. Setelah selesai, ketuk tombol <strong>Perbarui Status</strong> di atas untuk memverifikasi transaksi Anda.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">
                              ⚠️ MODE SIMULASI / DEMO AKTIF
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                              Hubungkan <code>{activeOrder?.paymentMethod?.includes("MIDTRANS") ? "MIDTRANS_SERVER_KEY" : "DOKU_CLIENT_ID"}</code> di menu Settings untuk mengaktifkan pembayaran asli. Saat ini, ketuk tombol <strong>Simulasikan Bayar</strong> untuk menyelesaikan pembayaran contoh secara otomatis.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Real-time Tracking UI */}
                      {paymentStatus === "settlement" && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-left">
                          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                            <span className="text-[10px] font-black text-slate-700 tracking-wide uppercase flex-1">Pelacakan Paket (Real-time)</span>
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">RESI: {activeOrder.waybill || "Tunggu Admin"}</span>
                          </div>
                          
                          {activeOrder.trackingHistory && activeOrder.trackingHistory.length > 0 ? (
                            <div className="relative pl-3 space-y-4 before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-slate-200 mt-2">
                              {activeOrder.trackingHistory.map((evt: any, idx: number) => (
                                <div key={idx} className="relative flex items-start gap-3">
                                  <div className="absolute -left-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white mt-1" />
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">{evt.status}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{evt.location} • {new Date(evt.date).toLocaleString('id-ID')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-medium text-center py-2">
                              {activeOrder.waybill 
                                ? "Menunggu update pelacakan dari pihak kurir..." 
                                : "Pesanan sedang disiapkan, resi akan segera diupdate oleh tim kami."}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveOrder(null);
                        }}
                        className="w-full text-slate-500 hover:text-slate-700 text-[10px] font-bold tracking-wider text-center pt-1"
                      >
                        ← Buat Pesanan Baru
                      </button>
                    </div>
                  ) : (
                    /* Checkout Form Panel */
                    <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-2xs">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                        <CreditCard className="w-4 h-4 text-red-600" />
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Form Pengiriman Instan</h4>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Nama Penerima Paket</label>
                          <input
                            type="text"
                            required
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            placeholder="Contoh: Aprhyzsilla"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Nomor WhatsApp / HP</label>
                            <input
                              type="tel"
                              required
                              value={checkoutPhone}
                              onChange={(e) => setCheckoutPhone(e.target.value)}
                              placeholder="Contoh: 081219154973"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-red-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Pilih Kurir Ekspedisi</label>
                              <BrandLogo brand={checkoutCourier} className="h-3 w-auto opacity-80" />
                            </div>
                            <select
                              value={checkoutCourier}
                              onChange={(e) => setCheckoutCourier(e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-red-500 font-bold cursor-pointer text-slate-700"
                            >
                              <optgroup label="Ojek Online (Instant / Same Day)">
                                <option value="gojek">Gojek (GoSend)</option>
                                <option value="grab">Grab (GrabExpress)</option>
                                <option value="lalamove">Lalamove</option>
                              </optgroup>
                              <optgroup label="Reguler & Hemat (Standard)">
                                <option value="jne">JNE Express</option>
                                <option value="jnt">J&T Express</option>
                                <option value="sicepat">SiCepat Ekspres</option>
                                <option value="idexpress">IDExpress</option>
                                <option value="ninja">Ninja Xpress</option>
                                <option value="pos">Pos Indonesia</option>
                                <option value="anteraja">Anteraja</option>
                                <option value="tiki">TIKI</option>
                              </optgroup>
                              <optgroup label="Kargo (Alat Berat)">
                                <option value="jnt_cargo">J&T Cargo</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Alamat Lengkap Pengiriman</label>
                          <MapAddressPicker
                            value={checkoutAddress}
                            onChange={(address) => setCheckoutAddress(address)}
                            placeholder="Tuliskan jalan, nomor rumah, kelurahan, kecamatan, kota, dan provinsi..."
                            isTextArea={true}
                          />
                          <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">💡 Tarif ongkir terhitung otomatis berdasarkan kota asal {logoSettings?.originCityName || "Surabaya"}.</p>
                        </div>

                        {/* Biteship Live Delivery Rate Info Box */}
                        <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                              Biteship Shipping Portal
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-50 text-red-600 uppercase tracking-wider border border-red-100/70">
                              Real-Time Rate Engine
                            </span>
                          </div>
                          
                          {calculatingShipping ? (
                            <div className="py-2 flex items-center justify-center gap-2 text-slate-400">
                              <svg className="animate-spin h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span className="text-[10.5px] font-semibold text-slate-500">Menghubungi Biteship API...</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-3xs">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Layanan Kurir</span>
                                <span className="font-extrabold text-slate-700">{shippingService || "REG (Regular)"}</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-3xs">
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Estimasi Pengiriman</span>
                                <span className="font-extrabold text-slate-700">{shippingEtd || "1-2 Hari Kerja"}</span>
                              </div>
                            </div>
                          )}

                          {/* Coordinates / Map Section for Instant courier */}
                          {["gojek", "grab", "lalamove"].includes(checkoutCourier.toLowerCase()) && (
                            <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/70 text-[11px] space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-700 flex items-center gap-1">📍 Koordinat Pengiriman Instan</span>
                                <span className="text-[8.5px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-md uppercase border border-emerald-100 animate-pulse">GPS Pinned</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9.5px] text-slate-600 font-mono">
                                <div>Asal Lat/Long: <span className="font-bold">-6.2011, 106.7822</span></div>
                                <div>Tujuan Lat/Long: <span className="font-bold">-6.1511, 106.8150</span></div>
                              </div>
                              <p className="text-[10px] text-blue-500 leading-normal">
                                * Biteship mendeteksi alamat Anda berada dalam cakupan pengiriman instan. Driver ojek online terdekat akan langsung dipesan secara otomatis begitu transaksi selesai.
                              </p>
                            </div>
                          )}

                          {/* Biteship Coverage Error Panel */}
                          {shippingError && (
                            <div className="bg-rose-50/85 p-3 rounded-xl border border-rose-100/80 text-[10.5px] space-y-1 text-left">
                              <div className="flex items-center gap-1.5 font-bold text-rose-950">
                                <span className="text-rose-600 font-black">⚠️ Wilayah Tidak Terjangkau:</span>
                              </div>
                              <p className="text-[9.5px] text-slate-600 font-bold leading-normal">
                                {shippingError}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2 text-left">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pilih Metode Pembayaran</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("DOKU")}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                paymentMethod === "DOKU"
                                  ? "border-red-600 bg-red-50/20 ring-1 ring-red-600"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <BrandLogo brand="DOKU" className="h-4 w-auto mb-1" />
                              <span className="text-[9px] font-extrabold text-slate-700">Doku Gateway</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod("MIDTRANS")}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                paymentMethod === "MIDTRANS"
                                  ? "border-red-600 bg-red-50/20 ring-1 ring-red-600"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <BrandLogo brand="MIDTRANS" className="h-4 w-auto mb-1" />
                              <span className="text-[9px] font-extrabold text-slate-700">Midtrans Gateway</span>
                            </button>
                          </div>
                        </div>

                        {/* Breakdown box */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Harga Baju</span>
                            <span className="font-bold text-slate-700">Rp {product.price.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Ongkir ({getCourierDisplayName(checkoutCourier)})</span>
                            {calculatingShipping ? (
                              <span className="text-red-500 text-[10px] font-bold animate-pulse">Menghitung tarif...</span>
                            ) : (
                              <span className="font-bold text-slate-700">Rp {shippingCost.toLocaleString("id-ID")} ({shippingEtd})</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Biaya Administrasi</span>
                            <span className="font-bold text-slate-700">Rp 2.000</span>
                          </div>
                          <div className="h-px bg-slate-200 my-1.5" />
                          <div className="flex justify-between text-slate-800 font-extrabold">
                            <span>Total Pembayaran</span>
                            <span className="text-red-600 text-sm font-black">
                              Rp {(product.price + shippingCost + 2000).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {/* Submit Checkout Button */}
                        <button
                          type="button"
                          onClick={handleCreateOrder}
                          disabled={chargingPayment || calculatingShipping || !checkoutAddress.trim() || !checkoutName.trim() || !checkoutPhone.trim() || !!shippingError || shippingCost === 0}
                          className={`w-full font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                            chargingPayment || calculatingShipping || !checkoutAddress.trim() || !checkoutName.trim() || !checkoutPhone.trim() || !!shippingError || shippingCost === 0
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/10"
                          }`}
                        >
                          {chargingPayment ? "Memproses Transaksi..." : `Konfirmasi Pembayaran & Buat Order`}
                        </button>
                        <div className="flex flex-wrap justify-center items-center gap-3 mt-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                          <BrandLogo brand="QRIS" className="h-3.5 w-auto" />
                          <BrandLogo brand="VA_BCA" className="h-3.5 w-auto" />
                          <BrandLogo brand="VA_MANDIRI" className="h-2.5 w-auto" />
                          <BrandLogo brand="VA_BRI" className="h-3.5 w-auto" />
                          <BrandLogo brand="VA_BNI" className="h-3 w-auto" />
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-4 mt-2.5 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                          <BrandLogo brand="JNE" className="h-2 w-auto" />
                          <BrandLogo brand="J&T" className="h-2 w-auto" />
                          <BrandLogo brand="SICEPAT" className="h-2 w-auto" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'tracking' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-2xs text-xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <Package className="w-4 h-4 text-red-600" />
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Lacak Resi Pengiriman Milestones</h4>
                    </div>

                    <div className="space-y-3">
                      <p className="text-slate-500 font-medium">Masukkan nomor resi ekspedisi (contoh: JP123456789 atau JN123456789) atau nomor resi yang Anda dapatkan di tab checkout.</p>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackingWaybill}
                          onChange={(e) => setTrackingWaybill(e.target.value)}
                          placeholder="Contoh: JP8392019482 atau JN1023948293"
                          className="flex-1 p-2.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleTrackPackage()}
                          disabled={searchingTracking}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black px-4 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {searchingTracking ? "Mencari..." : "Lacak"}
                        </button>
                      </div>
                    </div>

                    {trackingInfo ? (
                      <div className="space-y-4 border-t border-slate-100 pt-3.5 animate-fadeIn">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-medium text-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Ekspedisi Kurir</span>
                            <div className="flex items-center gap-1.5">
                              <BrandLogo brand={trackingInfo.courier} className="h-3 w-auto" />
                              <span className="font-bold text-slate-800">{trackingInfo.courier}</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Status Terkini</span>
                            <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] uppercase">
                              {trackingInfo.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Penerima Paket</span>
                            <span className="font-bold text-slate-800">{trackingInfo.receiver}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 mt-1">
                            <span className="text-slate-400">Mode Sistem</span>
                            <span className={`font-black px-2 py-0.5 rounded-md text-[9px] uppercase ${
                              trackingInfo.realApi 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}>
                              {trackingInfo.realApi ? "✓ LIVE REAL-TIME" : "SIMULASI / DEMO"}
                            </span>
                          </div>
                        </div>

                        {!trackingInfo.realApi && (
                          <div className="space-y-2">
                            {trackingInfo.apiError ? (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed font-medium">
                                <span className="font-bold text-amber-800 flex items-center gap-1.5 mb-1 text-[11px]">
                                  ⚠️ Gagal Koneksi Real-Time
                                </span>
                                <code className="block bg-amber-100/60 px-2 py-1 rounded text-red-700 font-mono text-[9px] break-all my-1.5">
                                  {trackingInfo.apiError}
                                </code>
                                <div className="text-slate-600 font-normal text-[10px] space-y-1.5 mt-1.5">
                                  <p>
                                    <strong>Rekomendasi Utama:</strong> Gunakan <strong>Biteship API</strong>. Biteship sangat stabil, responsif, dan mudah didaftarkan secara gratis. Pasang <code>BITESHIP_API_KEY</code> di menu Settings.
                                  </p>
                                </div>
                                <span className="block mt-1.5 text-slate-400 text-[9px] font-normal italic">
                                  Sistem otomatis beralih ke Mode Simulasi sementara agar riwayat tetap tampil.
                                </span>
                              </div>
                            ) : (
                                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[9px] text-slate-500 leading-relaxed font-medium">
                                  💡 <strong>Mode Simulasi Aktif:</strong> Pelacakan resi asli (JNE, J&T, SiCepat, POS) secara real-time memerlukan kunci API. Pasang <code>BITESHIP_API_KEY</code> (Sangat Direkomendasikan!) di menu Settings untuk mengaktifkannya secara langsung tanpa simulasi.
                                </div>
                            )}
                          </div>
                        )}

                        {/* Vertical timeline milestone */}
                        <div className="space-y-4 relative pl-5 border-l border-slate-200/80 ml-2">
                          {trackingInfo.history?.map((step: any, sIdx: number) => {
                            const isDelivered = step.status === "DELIVERED";
                            return (
                              <div key={sIdx} className="relative space-y-1">
                                {/* Bullet indicator */}
                                <div className={`absolute -left-7.5 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isDelivered 
                                    ? "bg-emerald-500 border-emerald-500 text-white text-[8px]" 
                                    : "bg-white border-red-500"
                                }`}>
                                  {isDelivered && "✓"}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${isDelivered ? "text-emerald-700" : "text-red-600"}`}>
                                    {step.status}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold">{step.time}</span>
                                </div>
                                <p className={`text-xs ${isDelivered ? "font-bold text-slate-800" : "text-slate-500"}`}>{step.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                        <p className="text-slate-400 font-semibold text-xs">Belum melacak resi.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Silakan masukkan resi lalu klik Lacak.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
