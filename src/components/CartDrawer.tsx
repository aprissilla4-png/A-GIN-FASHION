import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, Minus, Send, ShoppingBag, Truck, MapPin, Loader2, Calculator, AlertCircle, HelpCircle } from "lucide-react";
import { CartItem, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import DokuPaymentButton from "./DokuPaymentButton";
import MapAddressPicker from "./MapAddressPicker";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: User | null;
  onUpdateQuantity: (productId: string, quantity: number, size: string) => void;
  onUpdateSize: (productId: string, oldSize: string, newSize: string) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout?: (params: any) => Promise<any>;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  user,
  onUpdateQuantity,
  onUpdateSize,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  if (!isOpen) return null;

  const [destinationAddress, setDestinationAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("jne");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingService, setShippingService] = useState("");
  const [shippingEtd, setShippingEtd] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isLiveBiteship, setIsLiveBiteship] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const adminFee = cart.length > 0 ? 2000 : 0; // standard Tokopedia jasa aplikasi fee (Rp 2.000)
  const actualShippingCost = shippingCost !== null ? shippingCost : 0;
  const total = subtotal + adminFee + actualShippingCost;

  // Sizes options for fashion
  const availableSizes = ["S", "M", "L", "XL"];

  const handleCalculateShipping = async (addressToUse = destinationAddress, courierToUse = selectedCourier) => {
    if (!addressToUse.trim()) {
      setShippingCost(null);
      setShippingService("");
      setShippingEtd("");
      setShippingError(null);
      setApiError(null);
      return;
    }

    setIsCalculating(true);
    setShippingError(null);
    setApiError(null);

    // Calculate total weight (e.g. 0.2 kg per item)
    const totalWeight = Math.max(0.5, cart.reduce((acc, item) => acc + (0.2 * item.quantity), 0));

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destination: addressToUse.trim(),
          courier: courierToUse,
          weight: totalWeight
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghitung ongkos kirim.");
      }

      setShippingCost(data.cost || 0);
      setShippingService(data.service || "REG");
      setShippingEtd(data.etd || "1-2 Hari");
      setIsLiveBiteship(!!data.realApi);
      if (data.apiError) {
        setApiError(data.apiError);
      }
    } catch (err: any) {
      console.error("Error calculating shipping:", err);
      setShippingError(err.message || "Gagal menghubungkan ke server pengiriman.");
      setShippingCost(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Re-calculate shipping whenever courier changes or cart items change (to update weight and prices)
  useEffect(() => {
    if (destinationAddress.trim() && cart.length > 0) {
      handleCalculateShipping(destinationAddress, selectedCourier);
    }
  }, [selectedCourier, cart.length]);

  // WhatsApp checkout function as requested
  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0) return;

    // Create order in database first for tracking
    try {
      const productName = cart.length === 1 
        ? cart[0].product.name 
        : `${cart.length} Produk (Multiple Items)`;
        
      const productId = cart.length > 0 ? cart[0].product.id : "cart";
      const productImage = cart.length > 0 ? cart[0].product.image : "";
      const size = cart.length === 1 ? cart[0].selectedSize : "Mixed";

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          productId,
          productName,
          productImage,
          size,
          price: subtotal,
          quantity: cart.reduce((acc, item) => acc + item.quantity, 0),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          address: destinationAddress,
          courier: selectedCourier.toUpperCase(),
          shippingCost: shippingCost || 0,
          totalAmount: total,
          paymentMethod: "WHATSAPP"
        })
      });
    } catch (err) {
      console.error("Failed to create order record:", err);
    }

    // Number WA: change front 0 into 62 as described
    const noWA = "6281219154973"; 
    
    let pesan = "Halo Admin Tokopedia Fashion, saya ingin memesan produk berikut:%0A%0A";
    
    if (customerName.trim()) {
      pesan += `*Nama Penerima:* ${customerName}%0A`;
    }
    if (customerPhone.trim()) {
      pesan += `*No WhatsApp:* ${customerPhone}%0A`;
    }
    if (customerName.trim() || customerPhone.trim()) {
      pesan += `%0A`;
    }
    
    cart.forEach((item, index) => {
      const formattedPrice = `Rp ${item.product.price.toLocaleString("id-ID")}`;
      pesan += `*${index + 1}.* ${item.product.name}%0A   └ Ukuran: *${item.selectedSize}*%0A   └ Jumlah: *${item.quantity}* x ${formattedPrice}%0A%0A`;
    });
    
    pesan += `*Subtotal:* Rp ${subtotal.toLocaleString("id-ID")}%0A`;
    pesan += `*Biaya Layanan:* Rp ${adminFee.toLocaleString("id-ID")}%0A`;
    
    if (shippingCost !== null) {
      pesan += `*Ongkos Kirim (${selectedCourier.toUpperCase()} - ${shippingService}):* Rp ${shippingCost.toLocaleString("id-ID")} (${shippingEtd})%0A`;
      pesan += `*Alamat Tujuan:* ${destinationAddress}%0A`;
    }
    
    pesan += `*Total Pembayaran: Rp ${total.toLocaleString("id-ID")}*%0A%0A`;
    pesan += `Mohon informasi ketersediaan stok barang dan konfirmasi pesanan saya. Terima kasih!`;
    
    // Redirect to WhatsApp API
    const urlWA = `https://wa.me/${noWA}?text=${pesan}`;
    window.open(urlWA, "_blank", "referrer");
  };

  return (
    <motion.div 
      id="cart-drawer-overlay" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex justify-end"
    >
      {/* Background click listener to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slide-out drawer */}
      <motion.div 
        id="cart-drawer-container" 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col z-10"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Keranjang Belanja Anda</h3>
              <p className="text-[10px] text-slate-400 font-medium">{cart.length} item unik terpilih</p>
            </div>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup keranjang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-700 text-sm">Keranjang Anda Kosong</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Ayo cari busana fashion modern impianmu di beranda dan tambahkan ke sini sekarang!
              </p>
              <button
                onClick={onClose}
                className="mt-5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}`}
                className="flex gap-4 p-3 border border-slate-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/5 transition-all"
              >
                {/* Product Thumbnail */}
                <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-slate-800 text-[11px] truncate leading-tight flex-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                        className="text-slate-300 hover:text-blue-500 transition-colors p-0.5 cursor-pointer"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price and Category */}
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {item.product.category}
                    </div>

                    {/* Size Selector inside cart */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold">Ukuran:</span>
                      <div className="flex gap-1">
                        {availableSizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => onUpdateSize(item.product.id, item.selectedSize, sz)}
                            className={`w-5 h-5 rounded text-[9px] font-black flex items-center justify-center border transition-all cursor-pointer ${
                              item.selectedSize === sz
                                ? "bg-blue-600 border-blue-600 text-white font-black"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                    <span className="font-black text-xs text-blue-600">
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </span>

                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                        className="p-1 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 font-bold text-xs text-slate-700 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 hover:bg-slate-50 text-slate-500 disabled:opacity-50 transition-colors cursor-pointer"
                        aria-label="Tambah kuantitas"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Courier Selection & Destination Address Form */}
          {cart.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Simulasi & Hitung Ongkir (Biteship API)</span>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nama Penerima Paket
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Aprhyzsilla"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081219154973"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Destination Address Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Alamat Tujuan Pengiriman (Kota / Kecamatan / Kode Pos)
                </label>
                <MapAddressPicker
                  value={destinationAddress}
                  onChange={(address) => {
                    setDestinationAddress(address);
                    handleCalculateShipping(address, selectedCourier);
                  }}
                  placeholder="Contoh: Bandung, 40111 atau Jakarta Pusat"
                  isTextArea={false}
                />
              </div>

              {/* Courier Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Pilih Ekspedisi / Kurir
                </label>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium cursor-pointer"
                >
                  <optgroup label="Ojek Online (Instant / Same Day)">
                    <option value="gojek">Gojek</option>
                    <option value="grab">Grab</option>
                    <option value="lalamove">Lalamove</option>
                  </optgroup>
                  <optgroup label="Reguler & Hemat (Standard)">
                    <option value="jne">JNE Express</option>
                    <option value="jnt">J&T Express</option>
                    <option value="sicepat">SiCepat</option>
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

              {/* Calculate Button */}
              <button
                type="button"
                onClick={() => handleCalculateShipping()}
                disabled={isCalculating || !destinationAddress.trim()}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghitung...
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    Hitung Ongkir Sekarang
                  </>
                )}
              </button>

              {/* Calculation Result */}
              {shippingCost !== null && (
                <div className="space-y-2">
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1 text-left">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-900">
                      <span className="flex items-center gap-1">
                        📦 {selectedCourier.toUpperCase()} - {shippingService}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        {isLiveBiteship ? "LIVE VERIFIED" : "SIMULASI"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Estimasi Pengiriman: {shippingEtd}</span>
                      <span className="text-xs font-black text-emerald-700">Rp {shippingCost.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {apiError && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 space-y-1.5 text-left font-medium">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Kunci API Biteship Tidak Valid!</span>
                      </div>
                      <p className="leading-relaxed text-slate-600">
                        Sistem mencoba memanggil API Biteship asli, tetapi Biteship mengembalikan error: <code className="bg-amber-100/60 px-1 py-0.5 rounded text-amber-900 font-mono text-[9px]">"{apiError}"</code>.
                      </p>
                      <p className="leading-relaxed text-slate-600">
                        <strong>Penyebab:</strong> Format <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">BITESHIP_API_KEY</code> yang Anda masukkan di Settings berupa token JWT umum (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">eyJhbGci...</code>) milik "A-GIN FASHION". Format kunci Biteship asli yang benar harus diawali dengan:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[9px] text-slate-500">
                        <li>Sandbox: <code className="bg-slate-100 px-1 rounded font-mono">biteship_key.sandbox...</code></li>
                        <li>Production: <code className="bg-slate-100 px-1 rounded font-mono">biteship_key.production...</code></li>
                      </ul>
                      <p className="leading-relaxed text-slate-600">
                        Silakan ambil kunci API yang benar dari <strong>Dashboard Biteship &gt; Integrasi &gt; API Key</strong>, lalu perbarui di menu <strong>Settings</strong> AI Studio Anda.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {shippingError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-700 flex gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{shippingError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Billing Details & WA Checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal Barang</span>
                <span className="font-bold text-slate-700">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Biaya Layanan Aplikasi</span>
                <span className="font-bold text-slate-700">Rp {adminFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Ongkos Kirim ({selectedCourier.toUpperCase()})</span>
                <span className="font-bold text-slate-700">
                  {shippingCost !== null ? `Rp ${shippingCost.toLocaleString("id-ID")}` : "Belum dihitung"}
                </span>
              </div>
              <div className="border-t border-slate-200/50 my-2 pt-2 flex justify-between text-sm font-black text-slate-800">
                <span>Total Belanja</span>
                <span className="text-base text-red-600">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* WA checkout warning/explanation banner */}
            <div className="bg-rose-50 text-rose-800 rounded-xl p-3 border border-rose-100/50 flex items-start gap-2.5">
              <Send className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed font-semibold">
                Sistem akan menyusun rincian pesanan Anda dan membukanya di WhatsApp Admin untuk konfirmasi ongkos kirim & stok.
              </div>
            </div>

            {/* Checkout WA Button */}
            <button
              id="checkout-wa-btn"
              onClick={handleCheckoutWhatsApp}
              disabled={!destinationAddress || !customerName.trim() || !customerPhone.trim() || shippingCost === null}
              className="w-full bg-gradient-to-tr from-red-600 to-rose-600 hover:opacity-95 active:scale-[0.98] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Checkout via WhatsApp</span>
            </button>
            <DokuPaymentButton 
              cart={cart} 
              total={total} 
              user={user}
              address={destinationAddress} 
              courier={selectedCourier.toUpperCase()} 
              shippingCost={shippingCost} 
              customerName={customerName}
              customerPhone={customerPhone}
              onCheckout={onCheckout}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
