import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SmallBanner } from "../types";

interface SmallBannerSectionProps {
  smallBanners?: SmallBanner[];
}

export default function SmallBannerSection({ smallBanners = [] }: SmallBannerSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!smallBanners || smallBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % smallBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [smallBanners]);

  if (!smallBanners || smallBanners.length === 0) {
    return null;
  }

  const currentBanner = smallBanners[currentIndex];

  return (
    <section className="w-full py-12 bg-transparent" id="small-banner-slogan">
      <div className="max-w-[1400px] mx-auto px-[4vw]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch min-h-[320px]">
          
          {/* Left Column: Small Banner Image Slider */}
          <div className="relative overflow-hidden bg-transparent group flex flex-col aspect-[16/9] md:aspect-auto">
            <div className="relative w-full h-48 md:h-64 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img
                    src={currentBanner.image}
                    alt={currentBanner.title || "MADE TO MOVE"}
                    className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out group-hover:scale-105 brightness-105 contrast-100"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Slider Indicator Bullets */}
              {smallBanners.length > 1 && (
                <div className="absolute bottom-4 left-6 z-10 flex gap-2">
                  {smallBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? "bg-white w-5" : "bg-white/40 shadow-sm"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Text Below Banner */}
            <div className="relative z-10 p-6 bg-transparent text-[#2F2022] flex-1 flex flex-col justify-center">
              {currentBanner.subtitle && (
                <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#D46A7A] block mb-1">
                  {currentBanner.subtitle}
                </span>
              )}
              <h3 className="font-serif text-lg md:text-xl tracking-tight leading-tight font-extrabold">
                {currentBanner.title}
              </h3>
            </div>
          </div>

          {/* Right Column: Slogan & Branding Panel */}
          <div className="flex flex-col justify-center items-center text-center p-8 bg-transparent relative overflow-hidden group">
            {/* Elegant Background Grid Accent */}
            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#D46A7A_1px,transparent_1px),linear-gradient(to_bottom,#D46A7A_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <div className="relative z-10 max-w-md space-y-4">
              <span className="font-sans text-[10px] font-black tracking-[0.3em] text-[#D46A7A] block">
                A-GIN BRAND IDENTITY
              </span>
              
              <h2 className="font-sans font-extrabold text-[2.25rem] sm:text-[2.75rem] leading-none tracking-[0.18em] text-[#2F2022] uppercase select-none transition-all duration-500 group-hover:scale-[1.02] group-hover:text-[#D46A7A]">
                MADE TO <span className="text-[#D46A7A]">MOVE</span>
              </h2>
              
              <div className="h-0.5 w-12 bg-[#D46A7A] mx-auto rounded-full" />
              
              <p className="font-sans text-[0.85rem] text-[#5C4649]/80 leading-relaxed max-w-sm font-light">
                Kebebasan bergerak, kekuatan karakter, dan desain futuristik berpadu dalam setiap serat kain untuk menemani petualangan Anda.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
