import React, { useState } from "react";
import { Upload, Check, Shirt, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import { DtfSettings, Product, CartItem } from "../types";

interface SablonDtfViewProps {
  dtfSettings: DtfSettings;
  products: Product[];
  onAddToCart: (product: Product, sizeOrQuantity?: any, selectedSize?: string) => void;
}

export default function SablonDtfView({
  dtfSettings,
  products,
  onAddToCart
}: SablonDtfViewProps) {
  // Filter only plain t-shirts categorized under "Sablon DTF"
  const dtfProducts = products.filter((p) => p.category === "Sablon DTF");

  // Selection states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    dtfProducts.length > 0 ? dtfProducts[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [designSize, setDesignSize] = useState<"logo" | "a5" | "a4" | "a3">("a4");
  const [customDesignUrl, setCustomDesignUrl] = useState<string>("");
  const [customDesignFile, setCustomDesignFile] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);

  // Available t-shirt sizes
  const sizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

  // Design sizes and additional pricing
  const designSizeOptions = [
    { value: "logo", label: "Logo Dada (10x10 cm)", surcharge: 10000 },
    { value: "a5", label: "A5 (15x21 cm)", surcharge: 20000 },
    { value: "a4", label: "A4 (21x30 cm)", surcharge: 35000 },
    { value: "a3", label: "A3 (30x42 cm)", surcharge: 55000 }
  ];

  // Calculate size surcharge
  const getSizeSurcharge = (sz: string) => {
    if (sz === "XXL") return 10000;
    if (sz === "XXXL") return 15000;
    return 0;
  };

  // Get current prices
  const basePrice = selectedProduct ? selectedProduct.price : 55000;
  const sizeSurcharge = getSizeSurcharge(selectedSize);
  const dSizeSurcharge = designSizeOptions.find((opt) => opt.value === designSize)?.surcharge || 35000;
  const totalPricePerItem = basePrice + sizeSurcharge + dSizeSurcharge;
  const totalOrderPrice = totalPricePerItem * quantity;

  // File drag & drop or selection reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCustomDesignFile(reader.result as string);
        setCustomDesignUrl(""); // clear URL input if file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop events
  const [dragOver, setDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCustomDesignFile(reader.result as string);
        setCustomDesignUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submit to cart
  const handleAddCustomToCart = () => {
    if (!selectedProduct) return;

    // Use user-provided image, uploaded mockup image, or default custom placeholder
    const printedImage = customDesignFile || customDesignUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600";

    const customName = `Sablon DTF - ${selectedProduct.name} (${selectedSize})`;
    const customDesc = `Kustom Sablon DTF.\nUkuran Kaos: ${selectedSize}.\nUkuran Sablon: ${designSize.toUpperCase()} (${designSizeOptions.find(o => o.value === designSize)?.label}).\nCatatan: ${description || "Tidak ada catatan khusus"}`;

    // Create a virtual customized product
    const customProduct: Product = {
      id: `custom-dtf-${Date.now()}`,
      name: customName,
      price: totalPricePerItem,
      originalPrice: selectedProduct.originalPrice ? selectedProduct.originalPrice + sizeSurcharge + dSizeSurcharge : undefined,
      image: selectedProduct.image, // base shirt color image
      images: [printedImage, selectedProduct.image], // include the custom print design
      category: "Sablon DTF",
      stock: 999,
      description: customDesc
    };

    // Trigger cart addition
    onAddToCart(customProduct, quantity, selectedSize);
    
    // Set success indicator
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
    }, 3000);
  };

  // Determine virtual t-shirt mockup color/overlay background
  const isWhiteShirt = selectedProduct?.name.toLowerCase().includes("putih") || false;
  const mockupBgClass = isWhiteShirt ? "bg-slate-100" : "bg-zinc-900";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* DTF COVER BRANDING BANNER (Dynamic Settings) */}
      <div className="relative overflow-hidden h-[260px] md:h-[350px] shadow-lg w-full">
        <img
          src={dtfSettings.bannerImage || "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400"}
          alt="DTF Printing Workshop"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-slate-900/60 to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
          <div className="max-w-2xl space-y-2 md:space-y-3 px-0 md:px-8">
            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
              SABLON PRO LEVEL
            </span>
            <h2 className="text-xl md:text-3xl font-black tracking-tight leading-none text-red-500 uppercase">
              {dtfSettings.identityTitle || "A-GIN DTF & SABLON PREMIUM"}
            </h2>
            <p className="text-xs md:text-sm text-slate-200 font-bold tracking-wide">
              {dtfSettings.identitySubtitle || "Hasil Cetak Detail Tinggi, Elastis, dan Tahan Cuci"}
            </p>
            <p className="text-[10px] md:text-xs text-slate-300 font-medium leading-relaxed hidden md:block">
              {dtfSettings.description || "Layanan cetak sablon transfer film kelas distro teratas."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-6 md:px-8">
        {/* LEFT COLUMN: INTERACTIVE DESIGN BUILDER & SHIRT MOCKUP VISUALIZER (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Shirt className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">Konfigurasi Desain Sablon Anda</h3>
                <p className="text-[10px] text-slate-400 font-bold">Rancang visual sablon impian Anda secara langsung</p>
              </div>
            </div>

            {/* STEP 1: CHOOSE BASE KAOS POLOS */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                1. Pilih Warna Kaos Polos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dtfProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-red-600 bg-red-50/20 ring-2 ring-red-500/10 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-contain rounded mb-1.5"
                      />
                      <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                        {p.name.replace("Kaos Polos Cotton Combed 30s Premium - ", "")}
                      </span>
                      <span className="text-[10px] font-black text-red-600 mt-0.5">
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: SIZE CHANGER S-XXXL */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  2. Tentukan Ukuran Kaos
                </label>
                {getSizeSurcharge(selectedSize) > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded">
                    Tambahan Harga: +Rp {getSizeSurcharge(selectedSize).toLocaleString("id-ID")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  const extra = getSizeSurcharge(sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 px-1 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-100"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{sz}</span>
                      {extra > 0 && <span className="text-[8px] opacity-80 mt-0.5 font-bold">+{extra / 1000}k</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: DESIGN SIZE */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                3. Ukuran Cetak Sablon DTF
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {designSizeOptions.map((opt) => {
                  const isSelected = designSize === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setDesignSize(opt.value as any)}
                      className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? "border-red-600 bg-red-50/20 ring-2 ring-red-500/10"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-[11px] font-black text-emerald-950 uppercase tracking-wide">
                          {opt.value.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">{opt.label}</p>
                      </div>
                      <span className="text-xs font-black text-red-600">
                        +Rp {opt.surcharge.toLocaleString("id-ID")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: UPLOAD & INPUT GRAPHIC */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                4. Upload Gambar / Desain Sablon Anda
              </label>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                  dragOver ? "border-red-600 bg-red-50/10" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="file"
                  id="dtf-file-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Upload className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-700">Pilih berkas desain gambar</p>
                    <p className="text-[9px] text-slate-400 font-bold">PNG transparent recommended, JPEG, JPG (Maks. 10MB)</p>
                  </div>
                </div>
              </div>

              {/* URL Alternative Option */}
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold text-center">ATAU</p>
                <input
                  type="text"
                  placeholder="Atau tempel URL Gambar desain disini (e.g. https://...)"
                  value={customDesignUrl}
                  onChange={(e) => {
                    setCustomDesignUrl(e.target.value);
                    setCustomDesignFile(null); // clear file upload if URL is used
                  }}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* STEP 5: NOTES */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                5. Catatan / Posisi Sablon
              </label>
              <textarea
                placeholder="Contoh: Sablon diletakkan di dada sebelah kiri, atau bagian punggung belakang tengah..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE MOCKUP PREVIEW & DYNAMIC BILLING BREAKDOWN (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* MOCKUP CONTAINER */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm text-center relative overflow-hidden">
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow uppercase tracking-wider z-10">
              Live Mockup Preview
            </span>

            {/* Actual Mockup shirt background with design overlaid */}
            <div className={`w-full aspect-square rounded-xl ${mockupBgClass} flex items-center justify-center relative p-6 border border-slate-100 transition-colors duration-500 overflow-hidden`}>
              {/* Virtual Shirt Outline */}
              <img
                src={selectedProduct?.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600"}
                alt="Virtual Shirt"
                className="w-full h-full object-contain relative z-1 transition-transform"
              />

              {/* Dynamic Design Layer superimposed over the center-chest region of shirt */}
              {(customDesignFile || customDesignUrl) ? (
                <div 
                  className={`absolute z-10 pointer-events-none transition-all flex items-center justify-center overflow-hidden border border-dashed border-red-500/25`}
                  style={{
                    width: designSize === "logo" ? "18%" : designSize === "a5" ? "32%" : designSize === "a4" ? "45%" : "55%",
                    height: designSize === "logo" ? "18%" : designSize === "a5" ? "32%" : designSize === "a4" ? "45%" : "55%",
                    top: "40%",
                    left: "50%",
                    transform: "translate(-50%, -40%)"
                  }}
                >
                  <img
                    src={customDesignFile || customDesignUrl || ""}
                    alt="Custom design preview"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] animate-pulse"
                  />
                </div>
              ) : (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 border border-red-600 border-dashed rounded-lg p-3 max-w-[180px] z-10 text-center shadow">
                  <AlertCircle className="w-4 h-4 text-red-600 mx-auto mb-1 animate-bounce" />
                  <p className="text-[9px] font-bold text-slate-800">Silakan upload desain pada langkah ke-4 untuk melihat preview kaos</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-700 text-left">Kaos Terpilih:</p>
                <p className="text-[10px] text-slate-400 font-bold text-left">{selectedProduct?.name || "Kaos Polos Hitam Solid"}</p>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Distro Quality
              </span>
            </div>
          </div>

          {/* PRICING & ORDER CARD */}
          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-900/40 space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase text-red-500 tracking-widest">Detail Rincian Biaya</h4>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">Penghitungan transparan sesuai pilihan bahan & ukuran</p>
            </div>

            <div className="space-y-3 font-semibold text-xs border-b border-white/10 pb-4">
              <div className="flex justify-between text-slate-300">
                <span>Harga Base Kaos Polos</span>
                <span className="text-white">Rp {basePrice.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Surcharge Ukuran Kaos ({selectedSize})</span>
                <span className="text-white">Rp {sizeSurcharge.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cetak DTF {designSize.toUpperCase()} ({designSizeOptions.find(o => o.value === designSize)?.label.split(" (")[0]})</span>
                <span className="text-white">Rp {dSizeSurcharge.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-white/5">
                <span>Harga Per Kaos Sablon</span>
                <span className="text-red-400 font-black">Rp {totalPricePerItem.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* QUANTITY CHANGER */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Jumlah Pesanan</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center font-black text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center font-bold text-sm select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* TOTAL COST & CTA */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total Akhir</p>
                  <p className="text-xs text-slate-300 font-medium">({quantity} kaos sablon custom)</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-red-500">Rp {totalOrderPrice.toLocaleString("id-ID")}</p>
                </div>
              </div>

              {/* Order Submission */}
              <button
                onClick={handleAddCustomToCart}
                disabled={!selectedProduct}
                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
                  isOrdered 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                    : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                }`}
              >
                {isOrdered ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Berhasil Ditambahkan!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Masukkan ke Keranjang</span>
                  </>
                )}
              </button>
              <p className="text-[9px] text-slate-400 text-center font-bold">
                Kombinasi bahan kaos polos premium & cetak DTF berkelas tinggi terjamin puas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
