import React, { useState, useMemo, useEffect } from "react";
import { Product, DtfSettings } from "../types";
import { 
  MessageCircle, 
  Search, 
  ChevronLeft, 
  Share2, 
  MoreVertical,
  Maximize2,
  CheckCircle2,
  Clock,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DtfCatalogPageProps {
  dtfSettings: DtfSettings;
  products: Product[];
  onAddToCart: (product: Product, sizeOrQuantity?: any, selectedSize?: string) => void;
  onBack: () => void;
}

export default function DtfCatalogPage({
  dtfSettings,
  products,
  onAddToCart,
  onBack
}: DtfCatalogPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Strict Category Filter: Only Kaos, Hoodie, Jacket
  const allowedCategories = ["Kaos", "Hoodie", "Jacket"];
  
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must be dtf type
      if (p.productType !== "dtf") return false;
      
      // Strict Category Filter
      const isAllowedCategory = allowedCategories.includes(p.category);
      if (!isAllowedCategory) return false;

      const matchesCategory = categoryFilter === "Semua" || p.category === categoryFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  const whatsappNumber = dtfSettings?.whatsappNumber || "6281219154973";
  
  const handleWhatsApp = (product: Product) => {
    const textMsg = `Halo Admin A-GIN.\n\nSaya ingin bertanya mengenai:\nNama Produk: ${product.name}\nKategori: ${product.category}\nUkuran: ${product.sizes?.join(", ") || "-"}\nKode Produk: ${product.code || "-"}\n\nMohon informasi harga.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMsg)}`, "_blank");
  };

  const handleShare = async (product: Product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Cek jasa Print DTF ${product.name} di A-GIN!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-purple-50 rounded-full transition-colors text-purple-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-sm text-slate-900 tracking-tight leading-none">Print DTF Sablon A-GIN</h1>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-0.5">Marketplace Digital Printing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-purple-50 rounded-full transition-colors text-slate-500">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-purple-50 rounded-full transition-colors text-slate-500">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Banner (Admin Controlled) */}
      <div className="px-4 py-6">
        <div className="relative h-44 rounded-3xl overflow-hidden bg-gradient-to-tr from-purple-900 to-indigo-800 flex items-center px-8 shadow-xl shadow-purple-900/10">
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white leading-tight">Sablon Kualitas Tinggi<br/>Tanpa Minimal Order.</h2>
            <div className="mt-3 flex gap-2">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-tighter">Fast Production</span>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-tighter">HD Result</span>
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          {/* Subtle vector pattern overlay could go here */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        {/* Search & Filter Section */}
        <div className="space-y-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder="Cari produk, ukuran, atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-purple-200 focus:ring-4 focus:ring-purple-500/5 transition-all text-xs font-bold text-slate-700 outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {["Semua", ...allowedCategories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[11px] font-black transition-all border ${
                  categoryFilter === cat 
                    ? "bg-purple-900 border-purple-900 text-white shadow-lg shadow-purple-900/20" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-purple-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-500 cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[9px] font-black text-purple-900 rounded-full shadow-sm">
                      {product.category}
                    </span>
                    {product.printSize && (
                      <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm text-[9px] font-black text-white rounded-full shadow-sm">
                        {product.printSize}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white mx-auto">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-[12px] font-black text-slate-900 leading-tight line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold line-clamp-2 leading-relaxed mb-3">
                    {product.description || "Layanan cetak DTF kualitas HD dengan ketajaman warna maksimal."}
                  </p>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(product);
                    }}
                    className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 border border-purple-100 active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-purple-700 text-white" />
                    KONTAK UNTUK HARGA
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Belum ada produk Print DTF.</p>
              <p className="text-xs text-slate-400 font-bold mt-1">Harap upload katalog jasa Anda di halaman Admin.</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Sidebar/Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={() => handleShare(selectedProduct!)}
                  className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-600"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar">
                <div className="aspect-[4/5] bg-slate-100">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[9px] font-black rounded-full uppercase tracking-widest">
                        {selectedProduct.category}
                      </span>
                      {selectedProduct.code && (
                        <span className="text-[10px] text-slate-400 font-bold">#{selectedProduct.code}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedProduct.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ukuran Cetak</span>
                      <p className="text-xs font-black text-slate-800">{selectedProduct.printSize || "Custom Size"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimasi Produksi</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <p className="text-xs font-black text-slate-800">1-2 Hari Kerja</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Panduan File (Aturan Upload)</span>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-[10px] text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          Format PNG Transparent (Wajib)
                        </li>
                        <li className="flex items-start gap-2 text-[10px] text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          Resolusi Minimal 300 DPI
                        </li>
                        <li className="flex items-start gap-2 text-[10px] text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          Mode Warna CMYK
                        </li>
                        <li className="flex items-start gap-2 text-[10px] text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          Ukuran file sesuai area cetak
                        </li>
                      </ul>
                    </div>

                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block pt-2">Deskripsi Detail</span>
                    <p className="text-[11px] leading-relaxed text-slate-500 font-bold">
                      {selectedProduct.description || "Hasil cetak dengan teknologi DTF terbaru yang menjamin ketahanan cuci, kepekatan warna, dan elastisitas yang luar biasa pada media kain."}
                    </p>
                    <ul className="space-y-2 pt-2">
                      <li className="flex items-start gap-2 text-[10px] text-slate-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        Tinta Premium: Warna solid dan tahan lama.
                      </li>
                      <li className="flex items-start gap-2 text-[10px] text-slate-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        Lapis Powder High-Grade: Menempel sempurna di kain.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <button
                  onClick={() => handleWhatsApp(selectedProduct!)}
                  className="w-full py-4 bg-gradient-to-tr from-purple-900 to-indigo-800 text-white rounded-2xl font-black text-xs shadow-xl shadow-purple-900/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  KONTAK UNTUK INFO HARGA
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
