import React from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Tag, Sliders } from "lucide-react";
import { InfoBanner } from "../types";

interface InfoBannerSectionProps {
  infoBanners?: InfoBanner[];
  onNavigateToCollection: (banner: InfoBanner) => void;
  isAdmin?: boolean;
  onGoToAdmin?: () => void;
}

export default function InfoBannerSection({ 
  infoBanners = [], 
  onNavigateToCollection,
  isAdmin = false,
  onGoToAdmin
}: InfoBannerSectionProps) {
  const activeBanners = infoBanners.filter(b => b.isActive !== false);

  if (activeBanners.length === 0) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-[4vw] py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full min-h-[350px] md:min-h-[450px] rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-center p-8 space-y-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-radial-gradient from-white/50 to-transparent pointer-events-none" />
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-gray-500 border border-gray-200 bg-white/80 shadow-sm z-10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
            <span>Koleksi Eksklusif</span>
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-[#1B1B1B] uppercase leading-none z-10">
            Koleksi Terbaru Akan Segera Hadir
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-gray-400 max-w-xl leading-relaxed z-10">
            Rangkaian busana dengan kualitas premium sedang dipersiapkan. Aktifkan atau buat banner info baru dari Panel Admin untuk menampilkan rilis pakaian di sini.
          </p>

          {isAdmin && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1B1B1B] text-white hover:bg-black rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-md hover:scale-105 z-10 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-yellow-300" />
              <span>Buka Admin & Posting Banner</span>
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-[4vw] py-12">
      <div className="space-y-12">
        {activeBanners.map((banner, index) => (
          <motion.div
            key={banner.id || index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-video lg:h-[65vh] lg:min-h-[480px] overflow-hidden rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-center group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
            onClick={() => onNavigateToCollection(banner)}
          >
            {/* Massive Background Image (Perbesar seperti banner no 1) */}
            {banner.image ? (
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover select-none transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1513346038379-7ff156f74a8a?auto=format&fit=crop&q=80&w=1400";
                  }}
                />
                {/* Nike-Style Premium Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1B1B1B] via-gray-900 to-black flex items-center justify-center">
                {/* Fallback pattern when there is no background image */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#333_25%,transparent_25%),linear-gradient(-45deg,#333_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#333_75%),linear-gradient(-45deg,transparent_75%,#333_75%)] bg-[size:20px_20px]" />
              </div>
            )}

            {/* Typography & Call to Action overlay */}
            <div className="relative z-10 px-6 max-w-4xl space-y-5 text-white">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-[#FAF1EE] border border-white/20 bg-white/10 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>PILIHAN POPULER MINGGU INI</span>
              </span>

              <h2 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none drop-shadow-sm font-sans"
                style={{ color: banner.textColor || "#ffffff" }}
              >
                {banner.title}
              </h2>

              {banner.subtitle && (
                <p 
                  className="text-xs sm:text-sm md:text-base font-semibold max-w-2xl mx-auto leading-relaxed opacity-90 drop-shadow-sm font-sans text-gray-200"
                >
                  {banner.subtitle}
                </p>
              )}

              {/* Action Button */}
              <div className="pt-4">
                <span
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all bg-white text-black hover:bg-gray-100 hover:scale-105 shadow-md cursor-pointer"
                >
                  <span>{banner.buttonText || "LIHAT KOLEKSI"}</span>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* Decorative Vector Layout in BG */}
            <div className="absolute right-16 bottom-16 opacity-5 hidden lg:block select-none pointer-events-none">
              <Tag className="w-96 h-96 rotate-12 text-white" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
