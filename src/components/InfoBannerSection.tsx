import React from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { InfoBanner } from "../types";

interface InfoBannerSectionProps {
  infoBanners?: InfoBanner[];
}

export default function InfoBannerSection({ infoBanners = [] }: InfoBannerSectionProps) {
  const activeBanners = infoBanners.filter(b => b.isActive !== false);

  if (activeBanners.length === 0) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-[4vw] py-8">
      <div className="space-y-6">
        {activeBanners.map((banner, index) => (
          <motion.div
            key={banner.id || index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-100 group min-h-[320px] md:min-h-[380px] flex items-center"
            style={{ 
              backgroundColor: banner.bgColor || "#0f172a",
              color: banner.textColor || "#ffffff"
            }}
          >
            {/* Background Image with elegant overlay */}
            {banner.image && (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" 
                />
              </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 p-8 md:p-14 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/10 backdrop-blur-md text-amber-400 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PENAWARAN SPESIAL HARI INI</span>
              </span>

              <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight uppercase font-sans">
                {banner.title}
              </h2>

              {banner.subtitle && (
                <p className="text-sm md:text-base font-medium opacity-90 leading-relaxed max-w-xl">
                  {banner.subtitle}
                </p>
              )}

              {/* Button Action */}
              {banner.buttonText && (
                <div className="pt-3">
                  <a
                    href={banner.buttonUrl || "#"}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white text-slate-950 hover:bg-slate-100 hover:shadow-lg active:scale-95 cursor-pointer"
                  >
                    <span>{banner.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Decorative Tag Pattern in Background */}
            <div className="absolute right-12 bottom-12 opacity-5 hidden lg:block select-none pointer-events-none">
              <Tag className="w-72 h-72 rotate-12" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
