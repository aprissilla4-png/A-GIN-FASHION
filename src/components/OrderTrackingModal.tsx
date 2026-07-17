import React, { useState } from "react";
import { X, Package, Search, MapPin, Clock, CheckCircle2, Truck, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Event {
  time: string;
  status: string;
  description: string;
}

interface TrackingData {
  waybill: string;
  courier: string;
  status: string;
  receiver: string;
  history: Event[];
  realApi: boolean;
  apiError?: string | null;
}

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const [carrierCode, setCarrierCode] = useState("jne");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingData | null>(null);

  if (!isOpen) return null;

  const popularCarriers = [
    { code: "gojek", name: "Gojek", category: "Instant / Same Day" },
    { code: "grab", name: "Grab", category: "Instant / Same Day" },
    { code: "lalamove", name: "Lalamove", category: "Instant / Same Day" },
    { code: "jne", name: "JNE Express", category: "Reguler / Next Day" },
    { code: "jnt", name: "J&T Express", category: "Reguler" },
    { code: "sicepat", name: "SiCepat", category: "Reguler" },
    { code: "idexpress", name: "IDExpress", category: "Reguler" },
    { code: "ninja", name: "Ninja Xpress", category: "Reguler" },
    { code: "pos", name: "Pos Indonesia", category: "Reguler" },
    { code: "anteraja", name: "Anteraja", category: "Reguler" },
    { code: "tiki", name: "TIKI", category: "Reguler" },
    { code: "jnt_cargo", name: "J&T Cargo", category: "Cargo" }
  ];

  const quickDemos = [
    { carrier: "jnt", tracking: "JP123456789", label: "J&T Demo Resi" },
    { carrier: "jne", tracking: "JNE123456789", label: "JNE Demo Resi" },
    { carrier: "sicepat", tracking: "SICEPAT123456", label: "SiCepat Demo" }
  ];

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Nomor pelacakan (resi) wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const response = await fetch(
        `/api/shipping/track/${encodeURIComponent(trackingNumber.trim())}?courier=${encodeURIComponent(carrierCode)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan pelacakan.");
      }

      setTrackingResult(data);
      if (data.apiError) {
        setError(data.apiError);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server pelacakan.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = (carrier: string, tracking: string) => {
    setCarrierCode(carrier);
    setTrackingNumber(tracking);
    setError(null);
    setTrackingResult(null);
  };

  // Helper to color statuses
  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED") || s.includes("TERIMA") || s.includes("✓")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (s.includes("COURIER") || s.includes("ANTAR") || s.includes("JALAN")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (s.includes("PROCESS") || s.includes("TRANSIT") || s.includes("MANIFEST") || s.includes("SORTIR") || s.includes("ARRIVED")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED") || s.includes("TERIMA") || s.includes("✓")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (s.includes("COURIER") || s.includes("ANTAR") || s.includes("JALAN") || s.includes("TRANSIT")) {
      return <Truck className="w-4 h-4 text-blue-600" />;
    }
    return <Package className="w-4 h-4 text-slate-600" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Dark Overlay with backdrop blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal Dialog Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[#FBF9F6] text-[#1B1B1B] w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl relative overflow-y-auto p-6 sm:p-10 border border-[#111111]/10 z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-[#111111] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-black/10 pb-5 mb-6">
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#D46A7A] uppercase font-bold">
            Real-Time Carrier Integration
          </span>
          <h3 className="font-serif text-2xl font-light text-[#111111] mt-1">
            Lacak Kiriman Paket (Biteship API)
          </h3>
          <p className="text-xs text-slate-500 font-light mt-1">
            Lacak kiriman domestik Anda (JNE, J&T, SiCepat, POS, TIKI, dll.) secara langsung dari sistem Biteship Logistics Gateway.
          </p>
        </div>

        {/* Tracking Input Form */}
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[0.55rem] uppercase tracking-widest text-[#111111]/60 block mb-1.5 font-bold">
                Pilih Kurir (Carrier)
              </label>
              <select
                value={carrierCode}
                onChange={(e) => setCarrierCode(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-full px-4 py-2.5 text-[0.8rem] focus:outline-none focus:border-[#D46A7A] cursor-pointer text-slate-800 font-medium"
              >
                <optgroup label="Ojek Online (Instant / Same Day)">
                  {popularCarriers.filter(c => c.category === "Instant / Same Day").map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Reguler & Hemat (Standard)">
                  {popularCarriers.filter(c => c.category !== "Instant / Same Day" && c.category !== "Cargo").map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kargo (Alat Berat)">
                  {popularCarriers.filter(c => c.category === "Cargo").map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="font-mono text-[0.55rem] uppercase tracking-widest text-[#111111]/60 block mb-1.5 font-bold">
                Nomor Resi / Pelacakan
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Masukkan nomor resi..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-full pl-10 pr-4 py-2.5 text-[0.8rem] focus:outline-none focus:border-[#D46A7A] text-slate-800"
                />
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-between items-center">
            {/* Quick Demo Resi Option */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-[0.55rem] uppercase text-[#111111]/50 font-bold mr-1">
                Gunakan Demo:
              </span>
              {quickDemos.map((demo) => (
                <button
                  key={demo.tracking}
                  type="button"
                  onClick={() => handleLoadDemo(demo.carrier, demo.tracking)}
                  className={`text-[9px] px-2.5 py-1 rounded-full font-medium transition-all hover:bg-[#D46A7A]/10 hover:text-[#D46A7A] ${
                    trackingNumber === demo.tracking
                      ? "bg-[#D46A7A] text-white"
                      : "bg-[#111111]/5 text-slate-600"
                  }`}
                >
                  {demo.label}
                </button>
              ))}
            </div>

            {/* Track Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#D46A7A] hover:bg-[#C55263] text-white px-6 py-2.5 rounded-full font-medium text-[0.8rem] tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Lacak Paket
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="text-[0.8rem] text-rose-800 leading-relaxed font-medium">
              <p className="font-bold">Informasi Pelacakan</p>
              <p className="text-rose-600/90 font-normal">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Results Output */}
        <AnimatePresence mode="wait">
          {trackingResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 space-y-6"
            >
              {/* Header Status Bar */}
              <div className="p-4 bg-white border border-black/5 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="font-mono text-[0.55rem] uppercase tracking-wider text-[#111111]/40">
                    Kurir & No. Resi
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {popularCarriers.find((c) => c.code === carrierCode)?.name || carrierCode.toUpperCase()}{" "}
                    - <span className="font-mono font-medium">{trackingResult.waybill}</span>
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <span
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(
                      trackingResult.status
                    )}`}
                  >
                    {trackingResult.status}
                  </span>
                  {trackingResult.realApi ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">
                      LIVE VERIFIED
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[9px] font-bold">
                      SIMULASI
                    </span>
                  )}
                </div>
              </div>

              {/* API Notice Warning */}
              {!trackingResult.realApi && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 flex gap-2 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Informasi Simulasi:</strong> Pelacakan resi real-time menggunakan Biteship memerlukan kunci API yang valid. Pasang <code>BITESHIP_API_KEY</code> di menu Settings untuk mengaktifkannya secara langsung tanpa simulasi.
                  </div>
                </div>
              )}

              {/* Delivery Details Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-black/5 rounded-2xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="font-mono text-[0.55rem] uppercase text-[#111111]/40">
                      Penerima Paket
                    </p>
                    <p className="text-xs font-semibold text-[#111111]">
                      {trackingResult.receiver || "Pembeli"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-black/5 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-mono text-[0.55rem] uppercase text-[#111111]/40">
                      Status Terakhir
                    </p>
                    <p className="text-xs font-semibold text-[#111111] line-clamp-2">
                      {trackingResult.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Stepper Timeline */}
              <div className="space-y-4">
                <h4 className="font-serif text-base font-light text-[#111111]">
                  Riwayat Perjalanan Paket (Milestones)
                </h4>
                <div className="relative border-l border-black/10 ml-3 pl-6 space-y-6 py-2">
                  {trackingResult.history && trackingResult.history.length > 0 ? (
                    trackingResult.history.map((event, index) => (
                      <div key={index} className="relative">
                        {/* Bullet Icon */}
                        <span className="absolute -left-10 top-0.5 bg-[#FBF9F6] p-1 rounded-full border border-black/10 flex items-center justify-center">
                          {getStatusIcon(event.status)}
                        </span>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              {event.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#1B1B1B] font-medium leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic pl-2">
                      Belum ada informasi rincian perjalanan paket.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
