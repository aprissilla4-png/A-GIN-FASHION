import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Save, User as UserIcon, Key, Check, Image as ImageIcon, Heart, ShoppingBag, Package, Truck, Clock, MapPin, Search, ChevronRight, History } from "lucide-react";
import { User, Product, OrderTransaction } from "../types";
import { onSnapshot, doc } from "firebase/firestore";
import { db as clientDb } from "../lib/firebase";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (updatedUser: User) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
];

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  wishlist,
  onToggleWishlist,
  onAddToCart
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist" | "orders">("profile");
  const [orders, setOrders] = useState<OrderTransaction[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "orders" && user) {
      setLoadingOrders(true);
      // Real-time listener for orders via AppState document
      const unsub = onSnapshot(doc(clientDb, 'AppState', 'orders'), (docSnap) => {
        if (docSnap.exists()) {
          const allOrders = docSnap.data().data || [];
          // Filter orders for current user
          const myOrders = allOrders.filter((o: any) => o.userId === user.id);
          setOrders(myOrders.sort((a: any, b: any) => b.createdAt - a.createdAt));
        } else {
          setOrders([]);
        }
        setLoadingOrders(false);
      }, (err) => {
        console.error("Real-time orders error:", err);
        setLoadingOrders(false);
      });

      return () => unsub();
    }
  }, [activeTab, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar terlalu besar. Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
          setError("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatarUrl || "");
      setPassword("");
      setError("");
      setSuccess("");
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl,
          password: password || undefined
        })
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdateUser(updated);
        setSuccess("Profil Anda berhasil diperbarui!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errData = await response.json();
        setError(errData.error || "Gagal memperbarui profil.");
      }
    } catch (err) {
      setError("Kesalahan koneksi internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        id="profile-settings-modal" 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-emerald-950 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl text-white shadow-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Pengaturan Profil</h2>
              <p className="text-xs text-red-100 font-semibold">Kustomisasi foto & informasi akun Anda</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            type="button"
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'profile' ? 'text-emerald-950 border-b-2 border-emerald-950' : 'text-slate-400'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'wishlist' ? 'text-emerald-950 border-b-2 border-emerald-950' : 'text-slate-400'}`}
            onClick={() => setActiveTab('wishlist')}
          >
            Wishlist ({wishlist.length})
          </button>
          <button 
            type="button"
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'orders' ? 'text-emerald-950 border-b-2 border-emerald-950' : 'text-slate-400'}`}
            onClick={() => setActiveTab('orders')}
          >
            Pesanan
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold">
                {success}
              </div>
            )}

          {success && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-red-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Selection & Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Foto Profil Anda
            </label>
            
            <div className="flex items-center gap-4">
              {/* Image Preview */}
              <div className="relative group">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-950 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              {/* URL Input & Gallery file picker */}
              <div className="flex-1 space-y-2">
                <input 
                  type="url"
                  placeholder="Masukkan URL foto (https://...)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all text-slate-700 font-medium"
                />
                
                {/* File picker for local device photo gallery */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-950 transition-all active:scale-95 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                    <span>Pilih dari Galeri Perangkat</span>
                  </button>
                  {avatarUrl.startsWith("data:image/") && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">
                      Galeri
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 block">Atau pilih dari katalog preset:</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`relative rounded-full flex-shrink-0 w-10 h-10 overflow-hidden border-2 transition-all cursor-pointer ${
                      avatarUrl === preset ? "border-red-600 scale-105 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={preset} alt={`Preset ${index}`} className="w-full h-full object-cover" />
                    {avatarUrl === preset && (
                      <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white font-extrabold drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  required
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all text-slate-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Sandi Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password"
                  placeholder="Sandi baru minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all text-slate-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-extrabold hover:bg-red-700 transition-all shadow-md shadow-red-100 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Profil"}</span>
            </button>
          </div>
        </form>
        ) : activeTab === 'orders' ? (
          <div className="p-0 overflow-y-auto max-h-[60vh]">
            <div className="p-5 space-y-4">
              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Sinkronisasi Pesanan...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700">Belum Ada Pesanan</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed max-w-[200px]">
                    Riwayat belanja Anda akan muncul di sini secara real-time setelah Anda checkout.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div 
                      key={order.id} 
                      className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${
                        expandedOrder === order.id ? 'border-red-200 shadow-lg shadow-red-500/5 bg-white' : 'border-slate-100 bg-slate-50/50 hover:border-red-100 hover:bg-white'
                      }`}
                    >
                      {/* Order Header Summary */}
                      <div 
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-4 cursor-pointer flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 p-1 flex-shrink-0">
                          <img 
                            src={order.productImage} 
                            alt={order.productName} 
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{order.id}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                              order.paymentStatus === 'settlement' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : order.paymentStatus === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {order.paymentStatus === 'settlement' ? 'Berhasil' : order.paymentStatus === 'pending' ? 'Diproses' : order.paymentStatus}
                            </span>
                          </div>
                          <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight">{order.productName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-red-600">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">• {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                        <div className={`p-1 rounded-full transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-90 text-red-600 bg-red-50' : 'text-slate-300'}`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-red-50 bg-white"
                          >
                            <div className="p-4 space-y-4">
                              {/* Shipping & Payment Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Metode Bayar</span>
                                  <div className="flex items-center gap-1.5">
                                    <ShoppingBag className="w-3 h-3 text-red-600" />
                                    <span className="text-[10px] font-bold text-slate-700">{order.paymentMethod.replace('_', ' ')}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Ekspedisi</span>
                                  <div className="flex items-center gap-1.5">
                                    <Truck className="w-3 h-3 text-red-600" />
                                    <span className="text-[10px] font-bold text-slate-700">{order.courier}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Waybill / Resi */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5 text-slate-400" />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">No. Resi Pengiriman</span>
                                    <span className="text-[10px] font-black text-slate-700 font-mono tracking-wider">{order.waybill || "Sedang Diproses"}</span>
                                  </div>
                                </div>
                                {order.waybill && (
                                  <button className="text-[9px] font-black text-red-600 uppercase tracking-tighter hover:underline">Salin</button>
                                )}
                              </div>

                              {/* Real-time Tracking History */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-1.5">
                                  <History className="w-3 h-3 text-red-600" />
                                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Riwayat Pelacakan</span>
                                </div>
                                
                                {order.trackingHistory && order.trackingHistory.length > 0 ? (
                                  <div className="relative pl-4 space-y-4 border-l border-slate-100 ml-1.5 py-1">
                                    {order.trackingHistory.sort((a, b) => b.date - a.date).map((event, idx) => (
                                      <div key={idx} className="relative">
                                        <div className={`absolute -left-[20px] top-0.5 w-2 h-2 rounded-full border-2 border-white shadow-sm ${idx === 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-300'}`} />
                                        <div className="flex flex-col">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black leading-none ${idx === 0 ? 'text-red-600' : 'text-slate-700'}`}>{event.status}</span>
                                            <span className="text-[8px] font-bold text-slate-400">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          <span className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                            <MapPin className="w-2.5 h-2.5" />
                                            {event.location}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                                    <Clock className="w-4 h-4 text-slate-300 mx-auto mb-1.5" />
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Menunggu Penjemputan Kurir</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                Wishlist Anda masih kosong.
              </div>
            ) : (
              wishlist.map(product => (
                <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-500">Rp {product.price.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => onToggleWishlist(product)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="p-1.5 text-emerald-900 hover:bg-emerald-50 rounded-lg"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
