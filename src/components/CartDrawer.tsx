import React from "react";
import { X, Trash2, Plus, Minus, Send, ShoppingBag } from "lucide-react";
import { CartItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, size: string) => void;
  onUpdateSize: (productId: string, oldSize: string, newSize: string) => void;
  onRemoveItem: (productId: string, size: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onUpdateSize,
  onRemoveItem
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const adminFee = cart.length > 0 ? 2000 : 0; // standard Tokopedia jasa aplikasi fee (Rp 2.000)
  const total = subtotal + adminFee;

  // Sizes options for fashion
  const availableSizes = ["S", "M", "L", "XL"];

  // WhatsApp checkout function as requested
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    // Number WA: change front 0 into 62 as described
    const noWA = "6281219154973"; 
    
    let pesan = "Halo Admin Tokopedia Fashion, saya ingin memesan produk berikut:%0A%0A";
    
    cart.forEach((item, index) => {
      const formattedPrice = `Rp ${item.product.price.toLocaleString("id-ID")}`;
      pesan += `*${index + 1}.* ${item.product.name}%0A   └ Ukuran: *${item.selectedSize}*%0A   └ Jumlah: *${item.quantity}* x ${formattedPrice}%0A%0A`;
    });
    
    pesan += `*Subtotal:* Rp ${subtotal.toLocaleString("id-ID")}%0A`;
    pesan += `*Biaya Layanan:* Rp ${adminFee.toLocaleString("id-ID")}%0A`;
    pesan += `*Total Pembayaran: Rp ${total.toLocaleString("id-ID")}*%0A%0A`;
    pesan += `Mohon informasi ketersediaan stok barang dan ongkos kirim ke alamat saya. Terima kasih!`;
    
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
              <div className="border-t border-slate-200/50 my-2 pt-2 flex justify-between text-sm font-black text-slate-800">
                <span>Total Belanja</span>
                <span className="text-base text-blue-600">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* WA checkout warning/explanation banner */}
            <div className="bg-blue-50 text-blue-800 rounded-xl p-3 border border-blue-100/50 flex items-start gap-2.5">
              <Send className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed font-semibold">
                Sistem akan menyusun rincian pesanan Anda dan membukanya di WhatsApp Admin untuk konfirmasi ongkos kirim & stok.
              </div>
            </div>

            {/* Checkout WA Button */}
            <button
              id="checkout-wa-btn"
              onClick={handleCheckoutWhatsApp}
              className="w-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:opacity-95 active:scale-[0.98] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>Checkout via WhatsApp</span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
