import React, { useState, useEffect } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Banner } from "../types";

interface HeroSliderProps {
  banners?: Banner[];
  onShopNow: () => void;
  onWatchLookbook: () => void;
  onViewBadge: (tab: "shipping" | "returns" | "contact") => void;
}

export default function HeroSlider({ banners = [], onShopNow, onWatchLookbook, onViewBadge }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const activeBanners = banners && banners.length > 0 ? banners : [];

  if (activeBanners.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-[#111111]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={activeBanners[currentIndex].image}
            alt={activeBanners[currentIndex].title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${activeBanners[currentIndex].bgColor || "from-black/80 to-black/30"}`} />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full max-w-[1400px] mx-auto px-[4vw] flex flex-col justify-center text-[#F8F7F4] z-10">
        <div className="max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[#A68966] font-bold mb-4 block">
              {activeBanners[currentIndex].badge}
            </span>
            <h1 className="font-serif text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] leading-[1.05] tracking-tight whitespace-pre-line">
              {activeBanners[currentIndex].title}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-sans text-[0.95rem] md:text-[1.1rem] text-[#F8F7F4]/80 max-w-lg font-light leading-relaxed">
              {activeBanners[currentIndex].subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center gap-6 pt-4"
          >
            <button
              onClick={onShopNow}
              className="bg-[#F8F7F4] text-[#111111] font-mono text-[0.7rem] uppercase tracking-[0.2em] font-semibold px-8 py-4 rounded-full hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              Shop Now <span className="text-[0.8rem]">→</span>
            </button>
            <button
              onClick={onWatchLookbook}
              className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-[#F8F7F4] hover:text-[#A68966] transition-colors cursor-pointer group py-2"
            >
              <span className="w-8 h-8 rounded-full border border-[#F8F7F4]/30 flex items-center justify-center group-hover:border-[#A68966] transition-colors">
                <Play className="w-3.5 h-3.5 fill-current text-[#F8F7F4] group-hover:text-[#A68966] transition-colors ml-0.5" />
              </span>
              Watch Lookbook
            </button>
          </motion.div>
        </div>
      </div>

      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 right-[4vw] flex items-center gap-4 z-20">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-mono text-xs tracking-widest text-white/80">
            {String(currentIndex + 1).padStart(2, "0")} / {String(activeBanners.length).padStart(2, "0")}
          </div>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
