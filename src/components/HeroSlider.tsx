import React, { useState, useEffect } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Banner } from "../types";

interface HeroSliderProps {
  banners?: Banner[];
  onShopNow: () => void;
  onViewBadge: (tab: "shipping" | "returns" | "contact") => void;
}

export default function HeroSlider({ banners = [], onShopNow, onViewBadge }: HeroSliderProps) {
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

  const handleBannerClick = () => {
    const url = activeBanners[currentIndex].url;
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, "_blank");
      } else {
        window.location.href = url;
      }
    } else {
      onShopNow();
    }
  };

  return (
    <section className="w-full bg-[#FAFAFA] pb-12">
      {/* Image Slider */}
      <div className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-video lg:h-[75vh] lg:min-h-[500px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 cursor-pointer"
            onClick={handleBannerClick}
          >
            <img
              src={activeBanners[currentIndex].image}
              alt={activeBanners[currentIndex].title}
              className="w-full h-full object-cover select-none"
            />
          </motion.div>
        </AnimatePresence>

        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-[4vw] flex items-center gap-4 z-20">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-mono text-xs tracking-widest text-white/90 font-medium drop-shadow-md">
              {String(currentIndex + 1).padStart(2, "0")} / {String(activeBanners.length).padStart(2, "0")}
            </div>
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Text Content Below */}
      <div className="w-full max-w-[1400px] mx-auto px-[4vw] pt-10 flex flex-col text-[#2F2022] z-10">
        <div className="max-w-4xl space-y-6">
          <motion.div
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D46A7A] font-black inline-block mb-3">
              {activeBanners[currentIndex].badge}
            </span>
            <h1 className="font-serif text-[1.75rem] sm:text-[2.25rem] md:text-[3rem] leading-[1.1] tracking-tight whitespace-pre-line font-bold">
              {activeBanners[currentIndex].title}
            </h1>
          </motion.div>

          <motion.div
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="font-sans text-[0.95rem] md:text-[1.05rem] text-[#5C4649] font-medium max-w-2xl leading-relaxed">
              {activeBanners[currentIndex].subtitle}
            </p>
            {activeBanners[currentIndex].description && (
              <p className="font-sans text-[0.8rem] md:text-[0.9rem] text-[#5C4649]/80 max-w-2xl mt-3 leading-relaxed">
                {activeBanners[currentIndex].description}
              </p>
            )}
          </motion.div>

          <motion.div
            key={`btn-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-6 pt-4"
          >
            <button
              onClick={handleBannerClick}
              className="bg-[#D46A7A] text-white font-sans text-[0.7rem] uppercase tracking-[0.2em] font-bold px-8 py-4 rounded-full hover:bg-[#C55263] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D46A7A]/20"
            >
              Shop Now <span className="text-[0.8rem]">→</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
